import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { timeEntries } from '../../db/schema/card-features.js';
import { eq, and, desc } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { startTimeEntrySchema } from '@kanninja/shared';

export async function timeEntryRoutes(fastify: FastifyInstance) {
  // List time entries for a card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/time-entries',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(timeEntries)
        .where(eq(timeEntries.cardId, request.params.cardId))
        .orderBy(desc(timeEntries.startedAt));
      return { data };
    },
  );

  // Start a timer
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/time-entries/start',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = startTimeEntrySchema.parse(request.body);

      // Stop any running entries for this user on this card
      await db
        .update(timeEntries)
        .set({
          isRunning: false,
          endedAt: new Date(),
        })
        .where(
          and(
            eq(timeEntries.cardId, request.params.cardId),
            eq(timeEntries.userId, request.profileId!),
            eq(timeEntries.isRunning, true),
          ),
        );

      const [entry] = await db
        .insert(timeEntries)
        .values({
          cardId: request.params.cardId,
          userId: request.profileId!,
          startedAt: new Date(),
          isRunning: true,
          description: input.description ?? null,
        })
        .returning();

      return reply.status(201).send({ data: entry });
    },
  );

  // Stop the running timer
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/time-entries/stop',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const [running] = await db
        .select()
        .from(timeEntries)
        .where(
          and(
            eq(timeEntries.cardId, request.params.cardId),
            eq(timeEntries.userId, request.profileId!),
            eq(timeEntries.isRunning, true),
          ),
        )
        .limit(1);

      if (!running) throw AppError.notFound('Running timer');

      const endedAt = new Date();
      const durationSeconds = Math.floor((endedAt.getTime() - running.startedAt.getTime()) / 1000);

      const [stopped] = await db
        .update(timeEntries)
        .set({ isRunning: false, endedAt, durationSeconds })
        .where(eq(timeEntries.id, running.id))
        .returning();

      return { data: stopped };
    },
  );

  // Delete a time entry
  fastify.delete<{ Params: { boardId: string; cardId: string; entryId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/time-entries/:entryId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await db.delete(timeEntries).where(eq(timeEntries.id, request.params.entryId));
      return reply.status(204).send();
    },
  );
}
