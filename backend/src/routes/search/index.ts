import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { cards } from '../../db/schema/cards.js';
import { lists } from '../../db/schema/lists.js';
import { boards } from '../../db/schema/boards.js';
import { eq, ilike, or, and, inArray } from 'drizzle-orm';
import { boardRepo } from '../../repositories/board.repo.js';

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  boardId: z.string().uuid().optional(),
});

export async function searchRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/search',
    { preHandler: [requireAuth] },
    async (request) => {
      const { q, boardId } = searchQuerySchema.parse(request.query);
      const pattern = `%${q}%`;

      // Get boards the user has access to
      const userBoards = await boardRepo.findAllForUser(request.profileId!);
      const accessibleBoardIds = userBoards.map((b: { id: string }) => b.id);

      if (accessibleBoardIds.length === 0) {
        return { data: { cards: [] } };
      }

      // Scope to a specific board if requested
      const targetBoardIds = boardId
        ? accessibleBoardIds.filter((id: string) => id === boardId)
        : accessibleBoardIds;

      if (targetBoardIds.length === 0) {
        return { data: { cards: [] } };
      }

      const results = await db
        .select({
          cardId: cards.id,
          cardTitle: cards.title,
          cardDescription: cards.description,
          cardPriority: cards.priority,
          cardDueDate: cards.dueDate,
          cardIsCompleted: cards.isCompleted,
          listId: lists.id,
          listTitle: lists.title,
          boardId: boards.id,
          boardTitle: boards.title,
        })
        .from(cards)
        .innerJoin(lists, eq(lists.id, cards.listId))
        .innerJoin(boards, eq(boards.id, lists.boardId))
        .where(
          and(
            inArray(boards.id, targetBoardIds),
            or(ilike(cards.title, pattern), ilike(cards.description, pattern)),
          ),
        )
        .limit(50)
        .orderBy(boards.title, cards.updatedAt);

      return {
        data: {
          cards: results.map((r) => ({
            id: r.cardId,
            title: r.cardTitle,
            description: r.cardDescription,
            priority: r.cardPriority,
            dueDate: r.cardDueDate,
            isCompleted: r.cardIsCompleted,
            list: { id: r.listId, title: r.listTitle },
            board: { id: r.boardId, title: r.boardTitle },
          })),
        },
      };
    },
  );
}
