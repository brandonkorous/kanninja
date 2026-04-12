import { db } from '../db/index.js';
import { boards } from '../db/schema/boards.js';
import { boardClans } from '../db/schema/board-clans.js';
import { clanMembers } from '../db/schema/clans.js';
import { lists } from '../db/schema/lists.js';
import { cards } from '../db/schema/cards.js';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import type { BoardRole } from '@kanninja/shared';
import { BOARD_ROLE_RANK, effectiveRole } from '../utils/board-roles.js';

/**
 * Resolve a user's effective role on a board. The single source of
 * truth for the clan-centric access model with ceiling semantics:
 *
 *   1. If the user is the board's creator → 'owner' (short-circuit).
 *   2. Else find every clan attached to this board that the user is
 *      a member of. For each one, the user's effective role on the
 *      board is min(their clan tier mapped, the attachment ceiling).
 *      Across all such attachments, take the MAX.
 *   3. Else null (no access).
 *
 * Why "ceiling not uniform": clans have their own internal hierarchy
 * (admin/member/reader). Treating board_clans.role as a uniform
 * override would let clan readers edit cards they shouldn't touch,
 * and force every contractor clan admin to be a board owner. The
 * ceiling lets you cap the clan's max influence per board while
 * still respecting the clan's internal structure.
 */
export async function resolveBoardRole(
  boardId: string,
  userId: string,
): Promise<BoardRole | null> {
  const [board] = await db
    .select({ userId: boards.userId })
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) return null;
  if (board.userId === userId) return 'owner';

  const rows = await db
    .select({
      ceiling: boardClans.role,
      clanRole: clanMembers.role,
    })
    .from(boardClans)
    .innerJoin(
      clanMembers,
      and(
        eq(clanMembers.clanId, boardClans.clanId),
        eq(clanMembers.userId, userId),
      ),
    )
    .where(eq(boardClans.boardId, boardId));

  if (rows.length === 0) return null;

  let best: BoardRole | null = null;
  for (const row of rows) {
    const eff = effectiveRole(row.clanRole, row.ceiling);
    if (!best || BOARD_ROLE_RANK[eff] > BOARD_ROLE_RANK[best]) best = eff;
  }
  return best;
}

export const boardRepo = {
  /**
   * Boards the user can access — either as creator (role='owner') or
   * via a clan attached to the board. Dedupes by board id, keeping
   * the highest role when a board is reachable through multiple paths.
   *
   * Each row carries an `isCreator` flag so the UI can distinguish
   * "you created this" from "you're an owner via a clan attachment".
   * Only the creator can attach/detach clans, so the frontend uses
   * this flag to filter the "attach a dojo to this clan" picker.
   */
  async findAllForUser(userId: string) {
    // Path A — boards the user created (always 'owner', isCreator=true).
    const owned = await db
      .select({
        id: boards.id,
        title: boards.title,
        description: boards.description,
        userId: boards.userId,
        financialTrackingEnabled: boards.financialTrackingEnabled,
        projectBudget: boards.projectBudget,
        projectValueGoal: boards.projectValueGoal,
        currencyCode: boards.currencyCode,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
        role: sql<BoardRole>`'owner'::board_role`.as('role'),
      })
      .from(boards)
      .where(eq(boards.userId, userId));

    // Path B — boards attached to clans the user is a member of.
    // Each row's effective role is min(user's clan tier mapped,
    // attachment ceiling). Computed in JS post-fetch since the SQL
    // would be more verbose than the loop and the row count is tiny.
    const viaClanRaw = await db
      .select({
        id: boards.id,
        title: boards.title,
        description: boards.description,
        userId: boards.userId,
        financialTrackingEnabled: boards.financialTrackingEnabled,
        projectBudget: boards.projectBudget,
        projectValueGoal: boards.projectValueGoal,
        currencyCode: boards.currencyCode,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt,
        ceiling: boardClans.role,
        clanRole: clanMembers.role,
      })
      .from(boards)
      .innerJoin(boardClans, eq(boardClans.boardId, boards.id))
      .innerJoin(
        clanMembers,
        and(
          eq(clanMembers.clanId, boardClans.clanId),
          eq(clanMembers.userId, userId),
        ),
      );

    const viaClan = viaClanRaw.map(({ ceiling, clanRole, ...rest }) => ({
      ...rest,
      role: effectiveRole(clanRole, ceiling),
    }));

    // Merge + dedupe by board id, keeping the max effective role.
    // Sort by updatedAt desc to match the old behavior. isCreator
    // is derived from boards.userId so it's correct regardless of
    // which path surfaced the row.
    const byId = new Map<string, (typeof owned)[number]>();
    for (const row of [...owned, ...viaClan]) {
      const existing = byId.get(row.id);
      if (!existing || BOARD_ROLE_RANK[row.role] > BOARD_ROLE_RANK[existing.role]) {
        byId.set(row.id, row);
      }
    }
    return Array.from(byId.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map((row) => ({ ...row, isCreator: row.userId === userId }));
  },

  async findById(boardId: string) {
    const [board] = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1);
    return board ?? null;
  },

  /** Get a board with its lists and cards */
  async findByIdWithChildren(boardId: string) {
    const board = await this.findById(boardId);
    if (!board) return null;

    const boardLists = await db
      .select()
      .from(lists)
      .where(eq(lists.boardId, boardId))
      .orderBy(asc(lists.orderIndex));

    const listIds = boardLists.map((l) => l.id);
    let boardCards: (typeof cards.$inferSelect)[] = [];
    if (listIds.length > 0) {
      boardCards = await db
        .select()
        .from(cards)
        .where(inArray(cards.listId, listIds))
        .orderBy(asc(cards.orderIndex));
    }

    const cardsByList = new Map<string, (typeof cards.$inferSelect)[]>();
    for (const card of boardCards) {
      const existing = cardsByList.get(card.listId) ?? [];
      existing.push(card);
      cardsByList.set(card.listId, existing);
    }

    return {
      ...board,
      lists: boardLists.map((list) => ({
        ...list,
        cards: cardsByList.get(list.id) ?? [],
      })),
    };
  },

  /**
   * Create a board. Optionally attach it to a clan at creation time
   * (role='owner' on the attachment), so the creator's clan inherits
   * it immediately. Omitting `clanId` produces a personal board —
   * only the creator can see it until another clan is attached.
   */
  async create(data: { title: string; description?: string; userId: string; clanId?: string }) {
    const [board] = await db
      .insert(boards)
      .values({
        title: data.title,
        description: data.description ?? null,
        userId: data.userId,
      })
      .returning();

    if (data.clanId) {
      await db.insert(boardClans).values({
        boardId: board.id,
        clanId: data.clanId,
        role: 'owner',
      });
    }

    return board;
  },

  async update(
    boardId: string,
    data: Partial<{
      title: string;
      description: string | null;
      financialTrackingEnabled: boolean;
      projectBudget: string | null;
      projectValueGoal: string | null;
      currencyCode: string;
    }>,
  ) {
    const [board] = await db
      .update(boards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(boards.id, boardId))
      .returning();
    return board ?? null;
  },

  async delete(boardId: string) {
    await db.delete(boards).where(eq(boards.id, boardId));
  },

  /** Get the user's effective role on a board — thin wrapper around
   * the exported `resolveBoardRole` helper, kept on the repo object
   * so existing callers don't have to change their import shape. */
  async getMemberRole(boardId: string, userId: string) {
    return resolveBoardRole(boardId, userId);
  },
};
