import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { commentService } from '../../services/comment.service.js';
import { createCommentSchema, updateCommentSchema } from '@kanninja/shared';

export async function commentRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/comments',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const data = await commentService.listByCard(request.params.cardId);
      return { data };
    },
  );

  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/comments',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = createCommentSchema.parse(request.body);
      const c = await commentService.create(request.params.cardId, request.profileId!, input, {
        boardId: request.params.boardId,
      });
      return reply.status(201).send({ data: c });
    },
  );

  fastify.patch<{ Params: { boardId: string; cardId: string; commentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/comments/:commentId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateCommentSchema.parse(request.body);
      const c = await commentService.update(request.params.commentId, request.profileId!, input);
      return { data: c };
    },
  );

  fastify.delete<{ Params: { boardId: string; cardId: string; commentId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/comments/:commentId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await commentService.delete(request.params.commentId, request.profileId!);
      return reply.status(204).send();
    },
  );
}
