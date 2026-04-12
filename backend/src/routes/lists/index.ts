import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { listService } from '../../services/list.service.js';
import { createListSchema, updateListSchema, reorderListsSchema } from '@kanninja/shared';

export async function listRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/lists',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const lists = await listService.listByBoard(request.params.boardId);
      return { data: lists };
    },
  );

  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/lists',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = createListSchema.parse(request.body);
      const list = await listService.createList(request.params.boardId, input);
      return reply.status(201).send({ data: list });
    },
  );

  fastify.patch<{ Params: { boardId: string; listId: string } }>(
    '/api/v1/boards/:boardId/lists/:listId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateListSchema.parse(request.body);
      const list = await listService.updateList(request.params.listId, input);
      return { data: list };
    },
  );

  fastify.delete<{ Params: { boardId: string; listId: string } }>(
    '/api/v1/boards/:boardId/lists/:listId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await listService.deleteList(request.params.listId);
      return reply.status(204).send();
    },
  );

  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/lists/reorder',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = reorderListsSchema.parse(request.body);
      const lists = await listService.reorderLists(request.params.boardId, input);
      return { data: lists };
    },
  );
}
