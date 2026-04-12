import fp from 'fastify-plugin';
import { createClerkClient } from '@clerk/fastify';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { eq } from 'drizzle-orm';

declare module 'fastify' {
  interface FastifyInstance {
    clerk: ReturnType<typeof createClerkClient>;
  }
  interface FastifyRequest {
    clerkUserId?: string;
    profileId?: string;
    apiKeyId?: string;
  }
}

export const authPlugin = fp(async (fastify) => {
  const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  fastify.decorate('clerk', clerk);

  fastify.decorateRequest('clerkUserId', undefined);
  fastify.decorateRequest('profileId', undefined);
  fastify.decorateRequest('apiKeyId', undefined);
});

/** Resolves a Clerk user ID to a profiles.id UUID. */
async function resolveProfileId(clerkUserId: string): Promise<string | null> {
  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);
  return profile?.id ?? null;
}

export { resolveProfileId };
