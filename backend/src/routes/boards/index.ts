import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { boardService } from '../../services/board.service.js';
import { boardMemberService } from '../../services/board-member.service.js';
import { createBoardSchema, updateBoardSchema } from '@kanninja/shared';

export async function boardRoutes(fastify: FastifyInstance) {
  // List all boards for the current user
  fastify.get(
    '/api/v1/boards',
    { preHandler: [requireAuth] },
    async (request) => {
      const boards = await boardService.listBoards(request.profileId!);
      return { data: boards };
    },
  );

  // Get a single board with lists and cards
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId',
    { preHandler: [requireAuth] },
    async (request) => {
      const board = await boardService.getBoard(request.params.boardId, request.profileId!);
      return { data: board };
    },
  );

  // Create a new board
  fastify.post(
    '/api/v1/boards',
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const input = createBoardSchema.parse(request.body);
      const board = await boardService.createBoard(input, request.profileId!);
      return reply.status(201).send({ data: board });
    },
  );

  // Update a board
  fastify.patch<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateBoardSchema.parse(request.body);
      const board = await boardService.updateBoard(request.params.boardId, input);
      return { data: board };
    },
  );

  // List all members who can access a board
  fastify.get<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/members',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const members = await boardMemberService.listMembers(request.params.boardId);
      return { data: members };
    },
  );

  // Delete a board
  fastify.delete<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId',
    { preHandler: [requireAuth, requireBoardRole('owner')] },
    async (request, reply) => {
      await boardService.deleteBoard(request.params.boardId);
      return reply.status(204).send();
    },
  );
}
