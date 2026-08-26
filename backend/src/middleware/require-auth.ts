import { FastifyRequest, FastifyReply } from 'fastify';
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
 * this preHandler. Three credential shapes reach it, in this order:
 *
 *   1. `Authorization: Bearer ninja_live_…`  → API key (stdio MCP, scripts)
 *   2. `Authorization: Bearer <jwt>`         → MCP OAuth token (local HMAC)
 *   3. Session cookie                        → Better Auth (browsers)
 *
 * Bearer tokens are checked before the cookie because machine clients never
 * send cookies, so a bearer header is an unambiguous signal.
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

    // MCP JWT — local HMAC, no network. Tried early because it's free.
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
      // A session exists but no profile does — the case a databaseHooks
      // failure would leave behind. provisionProfile is idempotent, so this is
      // safe to race.
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

  throw AppError.unauthorized('Missing or invalid credentials');
}
