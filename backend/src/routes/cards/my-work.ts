import { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/require-auth.js';
import { db } from '../../db/index.js';
import { cards } from '../../db/schema/cards.js';
import { lists } from '../../db/schema/lists.js';
import { boards } from '../../db/schema/boards.js';
import { eq } from 'drizzle-orm';

export async function myWorkRoutes(fastify: FastifyInstance) {
  // Get all cards assigned to the current user, grouped by board
  fastify.get(
    '/api/v1/cards/my-work',
    { preHandler: [requireAuth] },
    async (request) => {
      const rows = await db
        .select({
          cardId: cards.id,
          cardTitle: cards.title,
          cardPriority: cards.priority,
          cardDueDate: cards.dueDate,
          cardIsCompleted: cards.isCompleted,
          cardProgress: cards.progress,
          cardOrderIndex: cards.orderIndex,
          listId: lists.id,
          listTitle: lists.title,
          boardId: boards.id,
          boardTitle: boards.title,
        })
        .from(cards)
        .innerJoin(lists, eq(lists.id, cards.listId))
        .innerJoin(boards, eq(boards.id, lists.boardId))
        .where(eq(cards.assigneeId, request.profileId!))
        .orderBy(boards.title, lists.orderIndex, cards.orderIndex);

      // Group by board
      const boardMap = new Map<string, { board: { id: string; title: string }; cards: unknown[] }>();
      for (const row of rows) {
        if (!boardMap.has(row.boardId)) {
          boardMap.set(row.boardId, {
            board: { id: row.boardId, title: row.boardTitle },
            cards: [],
          });
        }
        boardMap.get(row.boardId)!.cards.push({
          id: row.cardId,
          title: row.cardTitle,
          priority: row.cardPriority,
          dueDate: row.dueDate,
          isCompleted: row.cardIsCompleted,
          progress: row.cardProgress,
          list: { id: row.listId, title: row.listTitle },
        });
      }

      return { data: { boards: Array.from(boardMap.values()) } };
    },
  );
}
