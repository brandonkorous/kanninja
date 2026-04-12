import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { notificationQueue, notificationPreferences } from '../../db/schema/notifications.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';

export async function notificationRoutes(fastify: FastifyInstance) {
  // List notifications
  fastify.get('/api/v1/notifications', { preHandler: [requireAuth] }, async (request) => {
    const data = await db
      .select()
      .from(notificationQueue)
      .where(eq(notificationQueue.userId, request.profileId!))
      .orderBy(desc(notificationQueue.createdAt))
      .limit(100);
    return { data };
  });

  // Mark as read
  fastify.post<{ Params: { id: string } }>(
    '/api/v1/notifications/:id/read',
    { preHandler: [requireAuth] },
    async (request) => {
      const [n] = await db
        .update(notificationQueue)
        .set({ read: true })
        .where(
          and(
            eq(notificationQueue.id, request.params.id),
            eq(notificationQueue.userId, request.profileId!),
          ),
        )
        .returning();
      if (!n) throw AppError.notFound('Notification');
      return { data: n };
    },
  );

  // Mark all as read
  fastify.post(
    '/api/v1/notifications/read-all',
    { preHandler: [requireAuth] },
    async (request) => {
      await db
        .update(notificationQueue)
        .set({ read: true })
        .where(eq(notificationQueue.userId, request.profileId!));
      return { data: { success: true } };
    },
  );

  // Get preferences
  fastify.get(
    '/api/v1/notifications/preferences',
    { preHandler: [requireAuth] },
    async (request) => {
      const [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, request.profileId!))
        .limit(1);

      if (!prefs) {
        return { data: { settings: {} } };
      }
      return { data: prefs };
    },
  );

  // Update preferences
  fastify.patch(
    '/api/v1/notifications/preferences',
    { preHandler: [requireAuth] },
    async (request) => {
      const { settings } = z
        .object({ settings: z.record(z.unknown()) })
        .parse(request.body);

      const [prefs] = await db
        .insert(notificationPreferences)
        .values({ userId: request.profileId!, settings })
        .onConflictDoUpdate({
          target: notificationPreferences.userId,
          set: { settings, updatedAt: new Date() },
        })
        .returning();
      return { data: prefs };
    },
  );
}
