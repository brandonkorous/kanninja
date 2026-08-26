import fp from 'fastify-plugin';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { eq } from 'drizzle-orm';

declare module 'fastify' {
  interface FastifyRequest {
    /** Better Auth `auth_users.id`. Set on the browser session path. */
    authUserId?: string;
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
  fastify.decorateRequest('profileId', undefined);
  fastify.decorateRequest('apiKeyId', undefined);
  fastify.decorateRequest('mcpScopes', undefined);
  fastify.decorateRequest('mcpClientId', undefined);
  fastify.decorateRequest('mcpClientName', undefined);
});

/**
 * Translates a Better Auth user id into the application identity
 * (`profiles.id`), which is the only identity the rest of the app reads.
 */
export async function resolveProfileId(key: { userId?: string }): Promise<string | null> {
  if (!key.userId) return null;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, key.userId))
    .limit(1);
  return profile?.id ?? null;
}
