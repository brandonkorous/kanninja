import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { boardCompositionService } from '../../services/board-composition.service.js';
import {
  createBoardWithStructureSchema,
  applyStructureToBoardSchema,
  bulkCreateCardsSchema,
  bulkUpdateCardsSchema,
  duplicateCardSchema,
} from '@kanninja/shared';

export async function compositeRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/boards/with-structure',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const input = createBoardWithStructureSchema.parse(request.body);
      const result = await boardCompositionService.createBoardWithStructure(
        input,
        request.profileId!,
      );
      return reply.status(201).send({ data: result });
    },
  );

  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/apply-template',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = applyStructureToBoardSchema.parse(request.body);
      const result = await boardCompositionService.applyStructureToBoard(
        request.params.boardId,
        input,
        request.profileId!,
      );
      return reply.status(201).send({ data: result });
    },
  );

  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/cards/bulk',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = bulkCreateCardsSchema.parse(request.body);
      const result = await boardCompositionService.bulkCreateCards(
        request.params.boardId,
        input,
        request.profileId!,
      );
      return reply.status(201).send({ data: result });
    },
  );

  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/cards/bulk-update',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = bulkUpdateCardsSchema.parse(request.body);
      const result = await boardCompositionService.bulkUpdateCards(
        request.params.boardId,
        input,
      );
      return { data: result };
    },
  );

  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/duplicate',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = duplicateCardSchema.parse(request.body ?? {});
      const result = await boardCompositionService.duplicateCard(
        request.params.boardId,
        request.params.cardId,
        input,
        request.profileId!,
      );
      return reply.status(201).send({ data: result });
    },
  );
}
