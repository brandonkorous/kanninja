import fp from 'fastify-plugin';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { eq } from 'drizzle-orm';

declare module 'fastify' {
  interface FastifyRequest {
    /** Better Auth `auth_users.id`. Set on the browser session path. */
    authUserId?: string;
    /** Clerk user id. LEGACY — set only by the outgoing Clerk branch. */
    clerkUserId?: string;
    /** `profiles.id`. The only identity the rest of the app should read. */
    profileId?: string;
    apiKeyId?: string;
    mcpScopes?: string[];
    mcpClientId?: string;
    mcpClientName?: string;
  }
}

export const authPlugin = fp(async (fastify) => {
  fastify.decorateRequest('authUserId', undefined);
  fastify.decorateRequest('clerkUserId', undefined);
  fastify.decorateRequest('profileId', undefined);
  fastify.decorateRequest('apiKeyId', undefined);
  fastify.decorateRequest('mcpScopes', undefined);
  fastify.decorateRequest('mcpClientId', undefined);
  fastify.decorateRequest('mcpClientName', undefined);
});

/**
 * Translates an auth-provider id into the application identity
 * (`profiles.id`). Exactly one of the two keys should be supplied.
 */
export async function resolveProfileId(key: {
  userId?: string;
  clerkUserId?: string;
}): Promise<string | null> {
  const where = key.userId
    ? eq(profiles.userId, key.userId)
    : key.clerkUserId
      ? eq(profiles.clerkUserId, key.clerkUserId)
      : null;

  if (!where) return null;

  const [profile] = await db.select({ id: profiles.id }).from(profiles).where(where).limit(1);
  return profile?.id ?? null;
}
