import type { BoardRole } from '@kanninja/shared';

export const BOARD_ROLE_RANK: Record<BoardRole, number> = {
  viewer: 1,
  editor: 2,
  owner: 3,
};

type ClanMemberRole = 'admin' | 'member' | 'reader';

export const CLAN_TO_BOARD: Record<ClanMemberRole, BoardRole> = {
  admin: 'owner',
  member: 'editor',
  reader: 'viewer',
};

/**
 * Compute the effective board role from a clan member's role and
 * the board-clan attachment ceiling.
 *
 * effective = min(CLAN_TO_BOARD[clanRole], ceiling)
 */
export function effectiveRole(
  clanRole: ClanMemberRole,
  ceiling: BoardRole,
): BoardRole {
  const mapped = CLAN_TO_BOARD[clanRole];
  return BOARD_ROLE_RANK[mapped] < BOARD_ROLE_RANK[ceiling] ? mapped : ceiling;
}
