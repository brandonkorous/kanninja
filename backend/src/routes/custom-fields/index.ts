import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { db } from '../../db/index.js';
import { customFieldDefinitions, customFieldValues } from '../../db/schema/card-features.js';
import { eq, and, asc, desc } from 'drizzle-orm';
import { AppError } from '../../utils/errors.js';
import {
  createCustomFieldDefinitionSchema,
  updateCustomFieldDefinitionSchema,
  setCustomFieldValueSchema,
} from '@kanninja/shared';

export async function customFieldRoutes(fastify: FastifyInstance) {
  // List field definitions for a board
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/custom-field-definitions',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(customFieldDefinitions)
        .where(eq(customFieldDefinitions.boardId, request.params.boardId))
        .orderBy(asc(customFieldDefinitions.orderIndex));
      return { data };
    },
  );

  // Create field definition
  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/custom-field-definitions',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = createCustomFieldDefinitionSchema.parse(request.body);
      const [last] = await db
        .select({ orderIndex: customFieldDefinitions.orderIndex })
        .from(customFieldDefinitions)
        .where(eq(customFieldDefinitions.boardId, request.params.boardId))
        .orderBy(desc(customFieldDefinitions.orderIndex))
        .limit(1);

      const [def] = await db
        .insert(customFieldDefinitions)
        .values({
          boardId: request.params.boardId,
          name: input.name,
          fieldType: input.fieldType,
          options: input.options ?? null,
          isRequired: input.isRequired,
          orderIndex: (last?.orderIndex ?? 0) + 1,
          createdBy: request.profileId!,
        })
        .returning();
      return reply.status(201).send({ data: def });
    },
  );

  // Update field definition
  fastify.patch<{ Params: { boardId: string; defId: string } }>(
    '/api/v1/boards/:boardId/custom-field-definitions/:defId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateCustomFieldDefinitionSchema.parse(request.body);
      const [def] = await db
        .update(customFieldDefinitions)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(customFieldDefinitions.id, request.params.defId))
        .returning();
      if (!def) throw AppError.notFound('Custom field definition');
      return { data: def };
    },
  );

  // Delete field definition
  fastify.delete<{ Params: { boardId: string; defId: string } }>(
    '/api/v1/boards/:boardId/custom-field-definitions/:defId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await db.delete(customFieldDefinitions).where(eq(customFieldDefinitions.id, request.params.defId));
      return reply.status(204).send();
    },
  );

  // Get values for a card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/custom-fields',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await db
        .select()
        .from(customFieldValues)
        .where(eq(customFieldValues.cardId, request.params.cardId));
      return { data };
    },
  );

  // Set/update value for a card
  fastify.put<{ Params: { boardId: string; cardId: string; defId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/custom-fields/:defId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = setCustomFieldValueSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(customFieldValues)
        .where(
          and(
            eq(customFieldValues.cardId, request.params.cardId),
            eq(customFieldValues.fieldDefinitionId, request.params.defId),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(customFieldValues)
          .set({ value: input.value as Record<string, unknown> | null, updatedAt: new Date() })
          .where(eq(customFieldValues.id, existing.id))
          .returning();
        return { data: updated };
      }

      const [created] = await db
        .insert(customFieldValues)
        .values({
          cardId: request.params.cardId,
          fieldDefinitionId: request.params.defId,
          value: input.value as Record<string, unknown> | null,
        })
        .returning();
      return { data: created };
    },
  );
}
