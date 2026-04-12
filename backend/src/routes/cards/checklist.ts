import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { cardChecklistItems } from '../../db/schema/card-features.js';
import { eq, asc, desc } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';

const createSchema = z.object({
  title: z.string().min(1).max(500),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
});

export async function checklistRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/checklist',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(cardChecklistItems)
        .where(eq(cardChecklistItems.cardId, request.params.cardId))
        .orderBy(asc(cardChecklistItems.orderIndex));
      return { data };
    },
  );

  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/checklist',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = createSchema.parse(request.body);
      const [last] = await db
        .select({ orderIndex: cardChecklistItems.orderIndex })
        .from(cardChecklistItems)
        .where(eq(cardChecklistItems.cardId, request.params.cardId))
        .orderBy(desc(cardChecklistItems.orderIndex))
        .limit(1);
      const orderIndex = (last?.orderIndex ?? 0) + 1;

      const [item] = await db
        .insert(cardChecklistItems)
        .values({
          cardId: request.params.cardId,
          userId: request.profileId!,
          title: input.title,
          orderIndex,
        })
        .returning();
      return reply.status(201).send({ data: item });
    },
  );

  fastify.patch<{ Params: { boardId: string; cardId: string; itemId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/checklist/:itemId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateSchema.parse(request.body);
      const [item] = await db
        .update(cardChecklistItems)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(cardChecklistItems.id, request.params.itemId))
        .returning();
      if (!item) throw AppError.notFound('Checklist item');
      return { data: item };
    },
  );

  fastify.delete<{ Params: { boardId: string; cardId: string; itemId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/checklist/:itemId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await db.delete(cardChecklistItems).where(eq(cardChecklistItems.id, request.params.itemId));
      return reply.status(204).send();
    },
  );
}
