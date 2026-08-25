import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { profiles } from '../../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { updateProfileSchema } from '@kanninja/shared';

// Explicit column list rather than `select()`. A bare select leaks the
// auth-provider link (`user_id`, and the legacy `clerk_user_id`) to the
// browser; those are backend-internal. Mirrors `profileSchema` in shared.
const publicProfileColumns = {
  id: profiles.id,
  displayName: profiles.displayName,
  avatarUrl: profiles.avatarUrl,
  bio: profiles.bio,
  email: profiles.email,
  createdAt: profiles.createdAt,
  updatedAt: profiles.updatedAt,
};

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/users/me', { preHandler: [requireAuth] }, async (request) => {
    const [profile] = await db
      .select(publicProfileColumns)
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
      .returning(publicProfileColumns);
    return { data: profile };
  });
}
