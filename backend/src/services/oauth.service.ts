import { randomBytes, createHash, createHmac } from 'node:crypto';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  oauthClients,
  oauthAuthorizationCodes,
  oauthAuthorizationRequests,
  oauthRefreshTokens,
  profiles,
  subscriptions,
} from '../db/schema/index.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const ACCESS_TOKEN_TTL_SEC = 5 * 60;
const REFRESH_TOKEN_TTL_SEC = 30 * 24 * 60 * 60;
const AUTH_CODE_TTL_SEC = 10 * 60;
const AUTH_REQUEST_TTL_SEC = 10 * 60;

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function b64urlString(s: string): string {
  return b64url(Buffer.from(s));
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

function hmac(secret: string, data: string): Buffer {
  return createHmac('sha256', secret).update(data).digest();
}

export interface AccessTokenClaims {
  iss: string;
  sub: string; // profileId
  aud: string; // client_id
  client_name: string; // human-readable name, embedded so audit logging
  // doesn't need a per-request DB lookup
  scopes: string[];
  tier: string;
  iat: number;
  exp: number;
  jti: string;
}

export const oauthService = {
  /**
   * Sign an HS256 JWT using MCP_JWT_SECRET. Used for both minting (mcp-remote
   * via the issue-code flow) and validating (backend's require-auth, when an
   * incoming bearer doesn't match Clerk or ninja_live_).
   */
  signAccessToken(claims: Omit<AccessTokenClaims, 'iat' | 'exp' | 'jti' | 'iss'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullClaims: AccessTokenClaims = {
      iss: 'kanninja-mcp',
      ...claims,
      iat: now,
      exp: now + ACCESS_TOKEN_TTL_SEC,
      jti: b64url(randomBytes(16)),
    };
    const header = b64urlString(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = b64urlString(JSON.stringify(fullClaims));
    const signature = b64url(hmac(env.MCP_JWT_SECRET, `${header}.${payload}`));
    return `${header}.${payload}.${signature}`;
  },

  verifyAccessToken(token: string): AccessTokenClaims {
    const parts = token.split('.');
    if (parts.length !== 3) throw AppError.unauthorized('Malformed JWT');
    const [header, payload, signature] = parts;

    const expected = b64url(hmac(env.MCP_JWT_SECRET, `${header}.${payload}`));
    // Constant-time compare via length check + bitwise compare
    if (signature.length !== expected.length) {
      throw AppError.unauthorized('Invalid token signature');
    }
    let diff = 0;
    for (let i = 0; i < signature.length; i++) {
      diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    if (diff !== 0) throw AppError.unauthorized('Invalid token signature');

    let claims: AccessTokenClaims;
    try {
      claims = JSON.parse(b64urlDecode(payload).toString('utf8'));
    } catch {
      throw AppError.unauthorized('Malformed JWT payload');
    }
    if (claims.iss !== 'kanninja-mcp') throw AppError.unauthorized('Wrong issuer');
    if (claims.exp < Math.floor(Date.now() / 1000)) {
      throw AppError.unauthorized('Token expired');
    }
    return claims;
  },

  // ---- Clients (DCR + lookup) ----

  async upsertPublicClient(opts: { clientName: string; redirectUris: string[] }) {
    const clientId = `mcp_${b64url(randomBytes(16))}`;
    const [row] = await db
      .insert(oauthClients)
      .values({
        clientId,
        clientName: opts.clientName,
        redirectUris: opts.redirectUris,
        isPublic: 'true',
      })
      .returning();
    return row;
  },

  async getClient(clientId: string) {
    const [row] = await db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.clientId, clientId))
      .limit(1);
    return row ?? null;
  },

  // ---- Authorization request (pending consent) ----

  async createAuthorizationRequest(opts: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
    state: string;
    codeChallenge: string;
    codeChallengeMethod: string;
  }) {
    const reqId = b64url(randomBytes(24));
    const expiresAt = new Date(Date.now() + AUTH_REQUEST_TTL_SEC * 1000);
    const [row] = await db
      .insert(oauthAuthorizationRequests)
      .values({ ...opts, reqId, expiresAt })
      .returning();
    return row;
  },

  async getAuthorizationRequest(reqId: string) {
    const [row] = await db
      .select()
      .from(oauthAuthorizationRequests)
      .where(
        and(
          eq(oauthAuthorizationRequests.reqId, reqId),
          gt(oauthAuthorizationRequests.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ?? null;
  },

  // ---- Authorization code (created on consent) ----

  async issueAuthorizationCode(opts: {
    reqId: string;
    userId: string;
    grantedScopes: string[];
  }) {
    const req = await this.getAuthorizationRequest(opts.reqId);
    if (!req) throw AppError.notFound('Authorization request expired or not found');

    const code = b64url(randomBytes(32));
    const expiresAt = new Date(Date.now() + AUTH_CODE_TTL_SEC * 1000);

    await db.insert(oauthAuthorizationCodes).values({
      code,
      clientId: req.clientId,
      userId: opts.userId,
      redirectUri: req.redirectUri,
      scopes: opts.grantedScopes,
      codeChallenge: req.codeChallenge,
      codeChallengeMethod: req.codeChallengeMethod,
      expiresAt,
    });

    // Burn the request — it's been consented and the code now carries it forward.
    await db
      .delete(oauthAuthorizationRequests)
      .where(eq(oauthAuthorizationRequests.reqId, opts.reqId));

    return { code, redirectUri: req.redirectUri, state: req.state };
  },

  // ---- Token exchange ----

  async exchangeAuthorizationCode(opts: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  }) {
    const [row] = await db
      .select()
      .from(oauthAuthorizationCodes)
      .where(eq(oauthAuthorizationCodes.code, opts.code))
      .limit(1);

    if (!row) throw AppError.unauthorized('Invalid authorization code');
    if (row.consumedAt) throw AppError.unauthorized('Authorization code already used');
    if (row.expiresAt < new Date()) throw AppError.unauthorized('Authorization code expired');
    if (row.clientId !== opts.clientId) throw AppError.unauthorized('Client mismatch');
    if (row.redirectUri !== opts.redirectUri) throw AppError.unauthorized('Redirect URI mismatch');

    // PKCE verification
    const challengeFromVerifier = b64url(
      createHash('sha256').update(opts.codeVerifier).digest(),
    );
    if (challengeFromVerifier !== row.codeChallenge) {
      throw AppError.unauthorized('PKCE verification failed');
    }

    // Mark code consumed (one-time use)
    await db
      .update(oauthAuthorizationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(oauthAuthorizationCodes.id, row.id));

    return this.mintTokenPair({
      userId: row.userId,
      clientId: row.clientId,
      scopes: row.scopes,
    });
  },

  async refresh(opts: { refreshToken: string; clientId: string }) {
    const tokenHash = createHash('sha256').update(opts.refreshToken).digest('hex');
    const [row] = await db
      .select()
      .from(oauthRefreshTokens)
      .where(eq(oauthRefreshTokens.tokenHash, tokenHash))
      .limit(1);

    if (!row) throw AppError.unauthorized('Invalid refresh token');
    if (row.revokedAt) throw AppError.unauthorized('Refresh token revoked');
    if (row.expiresAt < new Date()) throw AppError.unauthorized('Refresh token expired');
    if (row.clientId !== opts.clientId) throw AppError.unauthorized('Client mismatch');

    // Rotate: revoke old, mint new.
    await db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(oauthRefreshTokens.id, row.id));

    return this.mintTokenPair({
      userId: row.userId,
      clientId: row.clientId,
      scopes: row.scopes,
      rotatedFromId: row.id,
    });
  },

  async mintTokenPair(opts: {
    userId: string;
    clientId: string;
    scopes: string[];
    rotatedFromId?: string;
  }) {
    // Resolve tier + client name in one round-trip — embedded in the JWT so
    // tier-gating and audit-logging both work without a DB hop per request.
    const [user, client] = await Promise.all([
      db
        .select({ tier: subscriptions.subscriptionTier })
        .from(profiles)
        .leftJoin(subscriptions, eq(subscriptions.userId, profiles.id))
        .where(eq(profiles.id, opts.userId))
        .limit(1)
        .then((r) => r[0]),
      db
        .select({ clientName: oauthClients.clientName })
        .from(oauthClients)
        .where(eq(oauthClients.clientId, opts.clientId))
        .limit(1)
        .then((r) => r[0]),
    ]);
    const tier = user?.tier ?? 'free';
    const clientName = client?.clientName ?? 'Unknown agent';

    const accessToken = oauthService.signAccessToken({
      sub: opts.userId,
      aud: opts.clientId,
      client_name: clientName,
      scopes: opts.scopes,
      tier,
    });

    const rawRefresh = `mcp_rt_${b64url(randomBytes(32))}`;
    const refreshHash = createHash('sha256').update(rawRefresh).digest('hex');
    const refreshExpires = new Date(Date.now() + REFRESH_TOKEN_TTL_SEC * 1000);
    await db.insert(oauthRefreshTokens).values({
      tokenHash: refreshHash,
      clientId: opts.clientId,
      userId: opts.userId,
      scopes: opts.scopes,
      rotatedFromId: opts.rotatedFromId,
      expiresAt: refreshExpires,
    });

    return {
      access_token: accessToken,
      token_type: 'Bearer' as const,
      expires_in: ACCESS_TOKEN_TTL_SEC,
      refresh_token: rawRefresh,
      scope: opts.scopes.join(' '),
    };
  },

  async revokeRefreshTokensForUser(userId: string) {
    await db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(oauthRefreshTokens.userId, userId), isNull(oauthRefreshTokens.revokedAt)));
  },

  /**
   * List active grants — one per (userId, clientId) pair. Rotated and revoked
   * refresh tokens are filtered out so the user only sees agents that can
   * currently act on their account.
   */
  async listActiveGrants(userId: string) {
    const rows = await db
      .select({
        clientId: oauthRefreshTokens.clientId,
        clientName: oauthClients.clientName,
        scopes: oauthRefreshTokens.scopes,
        createdAt: oauthRefreshTokens.createdAt,
      })
      .from(oauthRefreshTokens)
      .leftJoin(oauthClients, eq(oauthClients.clientId, oauthRefreshTokens.clientId))
      .where(
        and(
          eq(oauthRefreshTokens.userId, userId),
          isNull(oauthRefreshTokens.revokedAt),
          gt(oauthRefreshTokens.expiresAt, new Date()),
        ),
      );

    // Collapse rotated tokens — show one entry per clientId, picking the most
    // recently issued (its scopes are also the truth at refresh time).
    const byClient = new Map<
      string,
      { clientId: string; clientName: string | null; scopes: string[]; authorizedAt: Date }
    >();
    for (const row of rows) {
      const existing = byClient.get(row.clientId);
      if (!existing || row.createdAt > existing.authorizedAt) {
        byClient.set(row.clientId, {
          clientId: row.clientId,
          clientName: row.clientName,
          scopes: row.scopes,
          authorizedAt: row.createdAt,
        });
      }
    }
    return Array.from(byClient.values());
  },

  /**
   * Revoke every active refresh token for a (userId, clientId) pair. Access
   * tokens already issued remain valid for up to 5 minutes (their TTL); the
   * next refresh attempt will fail and the agent loses access.
   */
  async revokeGrant(userId: string, clientId: string) {
    const result = await db
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(oauthRefreshTokens.userId, userId),
          eq(oauthRefreshTokens.clientId, clientId),
          isNull(oauthRefreshTokens.revokedAt),
        ),
      )
      .returning({ id: oauthRefreshTokens.id });
    return { revoked: result.length };
  },
};
