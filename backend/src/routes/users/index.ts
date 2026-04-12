import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { updateProfileSchema } from '@kanninja/shared';

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/users/me', { preHandler: [requireAuth] }, async (request) => {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, request.profileId!))
      .limit(1);
    if (!profile) throw AppError.notFound('Profile');
    return { data: profile };
  });

  fastify.patch('/api/v1/users/me', { preHandler: [requireAuth] }, async (request) => {
    const input = updateProfileSchema.parse(request.body);
    const [profile] = await db
      .update(profiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profiles.id, request.profileId!))
      .returning();
    return { data: profile };
  });
}
