import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@clerk/fastify';
import { fromNodeHeaders } from 'better-auth/node';
import { env } from '../config/env.js';
import { auth } from '../lib/auth.js';
import { resolveProfileId } from '../plugins/auth.js';
import { AppError } from '../utils/errors.js';
import { provisionProfile } from '../services/profile-provisioning.service.js';
import { apiKeyService } from '../services/api-key.service.js';
import { oauthService } from '../services/oauth.service.js';

const API_KEY_PREFIX = 'ninja_live_';

/**
 * The single authentication chokepoint — every protected route runs through
 * this preHandler. Four credential shapes reach it, in this order:
 *
 *   1. `Authorization: Bearer ninja_live_…`  → API key (stdio MCP, scripts)
 *   2. `Authorization: Bearer <jwt>`         → MCP OAuth token (local HMAC)
 *   3. Session cookie                        → Better Auth (browsers)
 *   4. `Authorization: Bearer <jwt>`         → Clerk (LEGACY, see below)
 *
 * Bearer tokens are checked before the cookie because machine clients never
 * send cookies, so a bearer header is an unambiguous signal — and it keeps the
 * pre-existing API-key and MCP paths byte-for-byte unchanged.
 *
 * Branch 4 exists only for the Better Auth rollback window. It is disabled by
 * clearing CLERK_SECRET_KEY, and the whole branch is deleted at T+7d.
 */
export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    // API key path — token starts with ninja_live_
    if (token.startsWith(API_KEY_PREFIX)) {
      const result = await apiKeyService.verifyKey(token);
      request.profileId = result.userId;
      request.apiKeyId = result.keyId;
      return;
    }

    // MCP JWT — local HMAC, no network. Tried before Clerk because it's free.
    if (env.MCP_JWT_SECRET && token.split('.').length === 3) {
      try {
        const claims = oauthService.verifyAccessToken(token);
        request.profileId = claims.sub;
        request.mcpScopes = claims.scopes;
        request.mcpClientId = claims.aud;
        request.mcpClientName = claims.client_name;
        return;
      } catch {
        // Not an MCP JWT (signature/issuer mismatch) — fall through.
      }
    }
  }

  // Better Auth session cookie — the browser path.
  const session = await auth.api
    .getSession({ headers: fromNodeHeaders(request.headers) })
    .catch(() => null);

  if (session?.user) {
    request.authUserId = session.user.id;

    let profileId = await resolveProfileId({ userId: session.user.id });
    if (!profileId) {
      // A session exists but no profile does. Happens for users created by the
      // Clerk import (which seeds auth_users but leaves provisioning to the
      // backfill) and if a databaseHooks failure ever slipped through.
      // provisionProfile is idempotent, so this is safe to race.
      profileId = await provisionProfile({
        userId: session.user.id,
        email: session.user.email,
        displayName: session.user.name || null,
        avatarUrl: session.user.image ?? null,
      });
    }

    request.profileId = profileId;
    return;
  }

  // ---------------------------------------------------------------------
  // LEGACY: Clerk bearer token. Delete this block, the @clerk/fastify
  // dependency, and CLERK_SECRET_KEY once the rollback window has closed.
  // ---------------------------------------------------------------------
  if (token && env.CLERK_SECRET_KEY) {
    const clerkUserId = await verifyClerkToken(token);
    const profileId = await resolveProfileId({ clerkUserId });
    if (profileId) {
      request.clerkUserId = clerkUserId;
      request.profileId = profileId;
      return;
    }
    // No profile for a valid Clerk token means the user was created after the
    // Better Auth cutover and rolled back into. There is nothing sensible to
    // do but reject — the old lazy Clerk sync would create a *second* profile
    // and silently fork their data.
    throw AppError.unauthorized('Account not available on this authentication method');
  }

  throw AppError.unauthorized('Missing or invalid credentials');
}

async function verifyClerkToken(token: string): Promise<string> {
  try {
    const payload = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY });
    if (!payload.sub) throw AppError.unauthorized('Invalid token: no subject');
    return payload.sub;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired token');
  }
}
