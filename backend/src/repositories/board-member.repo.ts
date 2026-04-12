import { db } from '../db/index.js';
import { boards } from '../db/schema/boards.js';
import { boardClans } from '../db/schema/board-clans.js';
import { clanMembers } from '../db/schema/clans.js';
import { profiles } from '../db/schema/profiles.js';
import { eq } from 'drizzle-orm';
import type { BoardRole } from '@kanninja/shared';
import { BOARD_ROLE_RANK, effectiveRole } from '../utils/board-roles.js';

export interface BoardMember {
  userId: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  role: BoardRole;
}

export const boardMemberRepo = {
  /**
   * All users who can access a board: the creator (always owner) plus
   * every clan member reachable through board_clans attachments.
   * Deduped by userId, keeping the highest effective role.
   */
  async findAllForBoard(boardId: string): Promise<BoardMember[]> {
    // 1. Board creator — always owner
    const [board] = await db
      .select({
        userId: boards.userId,
        displayName: profiles.displayName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
      })
      .from(boards)
      .innerJoin(profiles, eq(profiles.id, boards.userId))
      .where(eq(boards.id, boardId))
      .limit(1);

    if (!board) return [];

    const byUserId = new Map<string, BoardMember>();
    byUserId.set(board.userId, {
      userId: board.userId,
      displayName: board.displayName,
      email: board.email,
      avatarUrl: board.avatarUrl,
      role: 'owner',
    });

    // 2. Clan members via board_clans attachments
    const rows = await db
      .select({
        userId: clanMembers.userId,
        displayName: profiles.displayName,
        email: profiles.email,
        avatarUrl: profiles.avatarUrl,
        ceiling: boardClans.role,
        clanRole: clanMembers.role,
      })
      .from(boardClans)
      .innerJoin(
        clanMembers,
        eq(clanMembers.clanId, boardClans.clanId),
      )
      .innerJoin(profiles, eq(profiles.id, clanMembers.userId))
      .where(eq(boardClans.boardId, boardId));

    for (const row of rows) {
      const eff = effectiveRole(row.clanRole, row.ceiling);
      const existing = byUserId.get(row.userId);
      if (!existing || BOARD_ROLE_RANK[eff] > BOARD_ROLE_RANK[existing.role]) {
        byUserId.set(row.userId, {
          userId: row.userId,
          displayName: row.displayName,
          email: row.email,
          avatarUrl: row.avatarUrl,
          role: eff,
        });
      }
    }

    return Array.from(byUserId.values()).sort((a, b) => {
      const aName = a.displayName ?? a.email;
      const bName = b.displayName ?? b.email;
      return aName.localeCompare(bName);
    });
  },
};
