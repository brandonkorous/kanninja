import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { cardService } from '../../services/card.service.js';
import { realtimeService } from '../../services/realtime.service.js';
import { dispatchEvent } from '../../integrations/dispatcher.js';
import { createCardSchema, updateCardSchema, moveCardSchema } from '@kanninja/shared';

export async function cardRoutes(fastify: FastifyInstance) {
  // Get a single card
  fastify.get<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const card = await cardService.getCard(request.params.cardId);
      return { data: card };
    },
  );

  // Create a card
  fastify.post<{ Params: { boardId: string } }>(
    '/api/v1/boards/:boardId/cards',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      const input = createCardSchema.parse(request.body);
      const card = await cardService.createCard(input, request.profileId!);
      await realtimeService.cardCreated(request.params.boardId, card.id);
      dispatchEvent(request.profileId!, {
        type: 'card.created', boardId: request.params.boardId, cardId: card.id,
        data: { title: card.title, description: card.description, dueDate: card.dueDate },
        userId: request.profileId!, timestamp: new Date(),
      }).catch(() => {});
      return reply.status(201).send({ data: card });
    },
  );

  // Update a card
  fastify.patch<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = updateCardSchema.parse(request.body);
      const card = await cardService.updateCard(request.params.cardId, input, {
        boardId: request.params.boardId,
        actorId: request.profileId!,
      });
      await realtimeService.cardUpdated(request.params.boardId, request.params.cardId);
      dispatchEvent(request.profileId!, {
        type: 'card.updated', boardId: request.params.boardId, cardId: request.params.cardId,
        data: { title: card.title, description: card.description, dueDate: card.dueDate },
        userId: request.profileId!, timestamp: new Date(),
      }).catch(() => {});
      return { data: card };
    },
  );

  // Move a card (change list and/or order)
  fastify.post<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId/move',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request) => {
      const input = moveCardSchema.parse(request.body);
      const card = await cardService.moveCard(request.params.cardId, input);
      await realtimeService.cardMoved(request.params.boardId, request.params.cardId);
      dispatchEvent(request.profileId!, {
        type: 'card.moved', boardId: request.params.boardId, cardId: request.params.cardId,
        data: { listId: input.listId, title: card.title },
        userId: request.profileId!, timestamp: new Date(),
      }).catch(() => {});
      return { data: card };
    },
  );

  // Delete a card
  fastify.delete<{ Params: { boardId: string; cardId: string } }>(
    '/api/v1/boards/:boardId/cards/:cardId',
    { preHandler: [requireAuth, requireBoardRole('editor')] },
    async (request, reply) => {
      await cardService.deleteCard(request.params.cardId);
      await realtimeService.cardDeleted(request.params.boardId, request.params.cardId);
      return reply.status(204).send();
    },
  );
}
