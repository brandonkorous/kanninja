import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '@clerk/fastify';
import { env } from '../config/env.js';
import { resolveProfileId } from '../plugins/auth.js';
import { AppError } from '../utils/errors.js';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { apiKeyService } from '../services/api-key.service.js';
import { oauthService } from '../services/oauth.service.js';

const API_KEY_PREFIX = 'ninja_live_';

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw AppError.unauthorized('Missing or invalid authorization header');
  }

  const token = authHeader.slice(7);

  // API key path — token starts with ninja_live_
  if (token.startsWith(API_KEY_PREFIX)) {
    const result = await apiKeyService.verifyKey(token);
    request.profileId = result.userId;
    request.apiKeyId = result.keyId;
    return;
  }

  // Two JWT paths share a prefix (eyJ...). Try MCP JWT first — local HMAC, no
  // network — and fall through to Clerk on signature mismatch. Only Clerk
  // gets the network round-trip.
  if (env.MCP_JWT_SECRET && token.split('.').length === 3) {
    try {
      const claims = oauthService.verifyAccessToken(token);
      request.profileId = claims.sub;
      request.mcpScopes = claims.scopes;
      request.mcpClientId = claims.aud;
      request.mcpClientName = claims.client_name;
      return;
    } catch {
      // Not an MCP JWT (signature/issuer mismatch) — fall through to Clerk.
    }
  }

  // Clerk JWT path
  let clerkUserId: string;
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
    });

    if (!payload.sub) {
      throw AppError.unauthorized('Invalid token: no subject');
    }

    clerkUserId = payload.sub;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw AppError.unauthorized('Invalid or expired token');
  }

  request.clerkUserId = clerkUserId;

  let profileId = await resolveProfileId(clerkUserId);
  if (!profileId) {
    profileId = await syncProfileFromClerk(request, clerkUserId);
  }

  request.profileId = profileId;
}

/**
 * Lazily create a profile row for a Clerk user when the webhook hasn't synced
 * them yet (common in local dev without a webhook tunnel, and a useful fallback
 * in production if a webhook delivery is missed).
 */
async function syncProfileFromClerk(
  request: FastifyRequest,
  clerkUserId: string,
): Promise<string> {
  const user = await request.server.clerk.users.getUser(clerkUserId);

  const primaryEmail =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw AppError.unauthorized('Clerk user has no email address');
  }

  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || null;

  const [inserted] = await db
    .insert(profiles)
    .values({
      clerkUserId,
      email: primaryEmail,
      displayName,
      avatarUrl: user.imageUrl ?? null,
    })
    .onConflictDoNothing({ target: profiles.clerkUserId })
    .returning({ id: profiles.id });

  if (inserted) {
    return inserted.id;
  }

  // Row already existed (concurrent request won the race) — re-read it.
  const existing = await resolveProfileId(clerkUserId);
  if (!existing) {
    throw AppError.unauthorized('Failed to sync user profile');
  }
  return existing;
}
