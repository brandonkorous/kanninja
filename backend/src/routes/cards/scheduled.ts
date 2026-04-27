import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/require-auth.js';
import { requireBoardRole } from '../../middleware/require-board-role.js';
import { requireClanRole } from '../../middleware/require-clan-role.js';
import { db } from '../../db/index.js';
import { cards } from '../../db/schema/cards.js';
import { lists } from '../../db/schema/lists.js';
import { boards } from '../../db/schema/boards.js';
import { boardClans } from '../../db/schema/board-clans.js';
import { cardLabels } from '../../db/schema/card-features.js';
import { boardRepo } from '../../repositories/board.repo.js';
import { eq, and, or, isNull, lte, gte, inArray, sql } from 'drizzle-orm';

const querySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  unscheduled: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

type ScheduledCard = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  assigneeId: string | null;
  startDate: Date | null;
  dueDate: Date | null;
  isCompleted: boolean;
  completedAt: Date | null;
  estimatedHours: string | null;
  progress: number;
  listId: string;
  listTitle: string;
  boardId: string;
  boardTitle: string;
  labelIds: string[];
};

/**
 * Query cards from a fixed set of lists, optionally filtered by date
 * range. The range filter uses a COALESCE-based span-overlap check so
 * cards with only startDate or only dueDate are still included when
 * the (degenerate) span overlaps [from, to]. Returns scheduled cards
 * (any date set) and, if `includeUnscheduled`, also cards with no
 * dates at all — both decorated with their list/board titles and a
 * flat array of label ids.
 */
async function queryCards(
  listIds: string[],
  range: { from?: string; to?: string },
  includeUnscheduled: boolean,
): Promise<{ scheduled: ScheduledCard[]; unscheduled: ScheduledCard[] }> {
  if (listIds.length === 0) return { scheduled: [], unscheduled: [] };

  const dateFilter = and(
    or(sql`${cards.startDate} IS NOT NULL`, sql`${cards.dueDate} IS NOT NULL`),
    range.from
      ? gte(sql`COALESCE(${cards.dueDate}, ${cards.startDate})`, new Date(range.from))
      : undefined,
    range.to
      ? lte(sql`COALESCE(${cards.startDate}, ${cards.dueDate})`, new Date(range.to))
      : undefined,
  );

  const scheduledRows = await db
    .select({
      id: cards.id,
      title: cards.title,
      description: cards.description,
      priority: cards.priority,
      assigneeId: cards.assigneeId,
      startDate: cards.startDate,
      dueDate: cards.dueDate,
      isCompleted: cards.isCompleted,
      completedAt: cards.completedAt,
      estimatedHours: cards.estimatedHours,
      progress: cards.progress,
      listId: cards.listId,
      listTitle: lists.title,
      boardId: lists.boardId,
      boardTitle: boards.title,
    })
    .from(cards)
    .innerJoin(lists, eq(lists.id, cards.listId))
    .innerJoin(boards, eq(boards.id, lists.boardId))
    .where(and(inArray(cards.listId, listIds), dateFilter));

  const unscheduledRows = includeUnscheduled
    ? await db
        .select({
          id: cards.id,
          title: cards.title,
          description: cards.description,
          priority: cards.priority,
          assigneeId: cards.assigneeId,
          startDate: cards.startDate,
          dueDate: cards.dueDate,
          isCompleted: cards.isCompleted,
          completedAt: cards.completedAt,
          estimatedHours: cards.estimatedHours,
          progress: cards.progress,
          listId: cards.listId,
          listTitle: lists.title,
          boardId: lists.boardId,
          boardTitle: boards.title,
        })
        .from(cards)
        .innerJoin(lists, eq(lists.id, cards.listId))
        .innerJoin(boards, eq(boards.id, lists.boardId))
        .where(
          and(
            inArray(cards.listId, listIds),
            isNull(cards.startDate),
            isNull(cards.dueDate),
          ),
        )
    : [];

  // Fetch labels in one batch and fan them out by cardId. Avoids
  // N+1 and keeps the response shape predictable for the frontend.
  const allCardIds = [...scheduledRows, ...unscheduledRows].map((c) => c.id);
  const labelRows = allCardIds.length
    ? await db
        .select({ cardId: cardLabels.cardId, labelId: cardLabels.labelId })
        .from(cardLabels)
        .where(inArray(cardLabels.cardId, allCardIds))
    : [];

  const labelsByCard = new Map<string, string[]>();
  for (const row of labelRows) {
    const existing = labelsByCard.get(row.cardId) ?? [];
    existing.push(row.labelId);
    labelsByCard.set(row.cardId, existing);
  }

  const decorate = (row: (typeof scheduledRows)[number]): ScheduledCard => ({
    ...row,
    labelIds: labelsByCard.get(row.id) ?? [],
  });

  return {
    scheduled: scheduledRows.map(decorate),
    unscheduled: unscheduledRows.map(decorate),
  };
}

export async function scheduledCardRoutes(fastify: FastifyInstance) {
  // Board-scoped: cards in any list of this board, optionally
  // filtered to a date range. The date filter uses span-overlap so
  // calendar/timeline/list views all consume the same endpoint with
  // different ranges.
  fastify.get<{
    Params: { boardId: string };
    Querystring: { from?: string; to?: string; unscheduled?: string | boolean };
  }>(
    '/api/v1/boards/:boardId/cards/scheduled',
    { preHandler: [requireAuth, requireBoardRole('viewer')] },
    async (request) => {
      const query = querySchema.parse(request.query);
      const boardLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(eq(lists.boardId, request.params.boardId));

      const result = await queryCards(
        boardLists.map((l) => l.id),
        query,
        query.unscheduled,
      );
      return { data: result };
    },
  );

  // Clan-scoped: aggregates cards across every board attached to the
  // clan that the requesting user ALSO has direct access to. This
  // intersection is the option-(b) decision from the design pass —
  // clan members never see cards from clan-attached dojos they aren't
  // members of, even if other clan-mates can. The intersection is
  // computed in JS over `boardRepo.findAllForUser` to reuse the
  // canonical access model instead of duplicating the resolution SQL.
  fastify.get<{
    Params: { clanId: string };
    Querystring: { from?: string; to?: string; unscheduled?: string | boolean };
  }>(
    '/api/v1/clans/:clanId/cards/scheduled',
    { preHandler: [requireAuth, requireClanRole('reader')] },
    async (request) => {
      const query = querySchema.parse(request.query);

      const clanBoardRows = await db
        .select({ boardId: boardClans.boardId })
        .from(boardClans)
        .where(eq(boardClans.clanId, request.params.clanId));
      const clanBoardIds = new Set(clanBoardRows.map((r) => r.boardId));

      const accessibleBoards = await boardRepo.findAllForUser(request.profileId!);
      const intersected = accessibleBoards
        .filter((b) => clanBoardIds.has(b.id))
        .map((b) => b.id);

      if (intersected.length === 0) {
        return { data: { scheduled: [], unscheduled: [] } };
      }

      const accessibleLists = await db
        .select({ id: lists.id })
        .from(lists)
        .where(inArray(lists.boardId, intersected));

      const result = await queryCards(
        accessibleLists.map((l) => l.id),
        query,
        query.unscheduled,
      );
      return { data: result };
    },
  );
}
