import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { customLabels, cardLabels } from '../../db/schema/card-features.js';
import { eq, and, isNull, or } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import { createLabelSchema, updateLabelSchema } from '@kanninja/shared';

export async function labelRoutes(fastify: FastifyInstance) {
  // List user's global labels
  fastify.get(
    '/api/v1/labels',
    { preHandler: [requireAuth] },
    async (request) => {
      const data = await db
        .select()
        .from(customLabels)
        .where(and(eq(customLabels.userId, request.profileId!), isNull(customLabels.boardId)));
      return { data };
    },
  );

  // List labels for a board (global + board-scoped)
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/labels',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(customLabels)
        .where(
          or(
            and(eq(customLabels.userId, request.profileId!), isNull(customLabels.boardId)),
            eq(customLabels.boardId, request.params.boardId),
          ),
        );
      return { data };
    },
  );

  // Create label
  fastify.post(
    '/api/v1/labels',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const input = createLabelSchema.parse(request.body);
      const [label] = await db
        .insert(customLabels)
        .values({
          userId: request.profileId!,
          boardId: input.boardId ?? null,
          name: input.name,
          color: input.color,
        })
        .returning();
      return reply.status(201).send({ data: label });
    },
  );

  // Update label
  fastify.patch<{ Params: { labelId: string } }>(
    '/api/v1/labels/:labelId',
    { preHandler: [requireAuth] },
    async (request) => {
      const input = updateLabelSchema.parse(request.body);
      const [label] = await db
        .update(customLabels)
        .set({ ...input, updatedAt: new Date() })
        .where(
          and(eq(customLabels.id, request.params.labelId), eq(customLabels.userId, request.profileId!)),
        )
        .returning();
      if (!label) throw AppError.notFound('Label');
      return { data: label };
    },
  );

  // Delete label
  fastify.delete<{ Params: { labelId: string } }>(
    '/api/v1/labels/:labelId',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      await db
        .delete(customLabels)
        .where(
          and(eq(customLabels.id, request.params.labelId), eq(customLabels.userId, request.profileId!)),
        );
      return reply.status(204).send();
    },
  );

  // Assign label to card
  fastify.post<{ Params: { boardId: string; cardId: string }; Body: { labelId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/labels',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const { labelId } = request.body;
      const [link] = await db
        .insert(cardLabels)
        .values({ cardId: request.params.cardId, labelId })
        .returning();
      return reply.status(201).send({ data: link });
    },
  );

  // Remove label from card
  fastify.delete<{ Params: { boardId: string; cardId: string; labelId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/labels/:labelId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await db
        .delete(cardLabels)
        .where(
          and(
            eq(cardLabels.cardId, request.params.cardId),
            eq(cardLabels.labelId, request.params.labelId),
          ),
        );
      return reply.status(204).send();
    },
  );

  // Get labels assigned to a card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/labels',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select({
          id: customLabels.id,
          name: customLabels.name,
          color: customLabels.color,
        })
        .from(cardLabels)
        .innerJoin(customLabels, eq(cardLabels.labelId, customLabels.id))
        .where(eq(cardLabels.cardId, request.params.cardId));
      return { data };
    },
  );
}
