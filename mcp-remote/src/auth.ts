import { createHmac } from 'node:crypto';
import { createApiClient } from 'kanninja-mcp/api-client';
import type { McpContext } from 'kanninja-mcp/context';
import { env } from './config/env.js';

interface VerifyKeyResponse {
  data: {
    userId: string;
    displayName: string | null;
    email: string;
    tier: string;
  };
}

export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
    public readonly wwwAuthenticate?: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface AccessTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  scopes: string[];
  tier: string;
  iat: number;
  exp: number;
  jti: string;
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verify an MCP-issued access token (HS256 with MCP_JWT_SECRET). Throws
 * AuthError on any signature/claim failure. Local-only — no DB or network.
 */
function verifyAccessToken(token: string): AccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) throw new AuthError(401, 'Malformed JWT');
  const [header, payload, signature] = parts;

  const expected = b64url(
    createHmac('sha256', env.MCP_JWT_SECRET).update(`${header}.${payload}`).digest(),
  );
  if (!constantTimeEqual(signature, expected)) {
    throw new AuthError(401, 'Invalid token signature');
  }

  let claims: AccessTokenClaims;
  try {
    claims = JSON.parse(b64urlDecode(payload).toString('utf8'));
  } catch {
    throw new AuthError(401, 'Malformed JWT payload');
  }
  if (claims.iss !== 'kanninja-mcp') throw new AuthError(401, 'Wrong issuer');
  if (claims.exp < Math.floor(Date.now() / 1000)) {
    throw new AuthError(401, 'Token expired');
  }
  return claims;
}

/**
 * Resolve a bearer token into a per-request McpContext.
 *
 * Two recognised token shapes:
 *   1. `ninja_live_*` — a per-user kanNINJA API key created via Settings.
 *      Validated by calling /api/v1/auth/verify-key (same path the local
 *      stdio server uses).
 *   2. MCP-issued JWT — minted via the OAuth flow. Validated locally with
 *      MCP_JWT_SECRET. Forwarded as-is to the REST API; backend's
 *      require-auth.ts validates the same JWT and resolves it to a profile.
 *
 * Returns a fresh `callApi` pre-bound to whichever token came in, so concurrent
 * requests can never share a key.
 */
export async function authenticateRequest(
  authHeader: string | undefined,
  apiUrl: string,
): Promise<McpContext> {
  if (!authHeader) {
    throw new AuthError(401, 'Missing Authorization header', 'Bearer realm="kanninja-mcp"');
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) {
    throw new AuthError(401, 'Authorization header must use Bearer scheme', 'Bearer realm="kanninja-mcp"');
  }

  const token = match[1].trim();
  if (!token) {
    throw new AuthError(401, 'Empty bearer token', 'Bearer realm="kanninja-mcp"');
  }

  // Path 1: kanNINJA API key
  if (token.startsWith('ninja_live_')) {
    const callApi = createApiClient(token, apiUrl);
    let verified: VerifyKeyResponse;
    try {
      verified = await callApi.post<VerifyKeyResponse>(
        '/api/v1/auth/verify-key',
        { key: token },
      );
    } catch {
      throw new AuthError(401, 'Invalid or revoked API key', 'Bearer realm="kanninja-mcp", error="invalid_token"');
    }
    return {
      userId: verified.data.userId,
      displayName: verified.data.displayName,
      email: verified.data.email,
      tier: verified.data.tier,
      apiUrl,
      callApi,
    };
  }

  // Path 2: MCP-issued JWT
  if (token.split('.').length === 3) {
    const claims = verifyAccessToken(token);
    return {
      userId: claims.sub,
      displayName: null,
      email: '',
      tier: claims.tier,
      apiUrl,
      callApi: createApiClient(token, apiUrl),
    };
  }

  throw new AuthError(401, 'Unrecognised bearer token format', 'Bearer realm="kanninja-mcp"');
}
