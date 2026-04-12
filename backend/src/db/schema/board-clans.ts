import { pgTable, uuid, timestamp, unique } from 'drizzle-orm/pg-core';
import { boards, boardRoleEnum } from './boards';
import { clans } from './clans';

// The many-to-many grant table linking boards to clans. A board can be
// attached to 0..N clans; each attachment carries the CEILING role for
// that clan on that board (reuses boardRoleEnum: owner|editor|viewer).
//
// Access resolution for user U on board B (see board.repo.ts):
//   1. If boards.user_id === U → role = 'owner' (creator short-circuit)
//   2. Else for every clan attached to B that U is a member of:
//        effective = min(U's clan tier mapped, this attachment's ceiling)
//      Take the MAX of those effectives. If empty → 403.
//
// Why "ceiling not uniform": clan_members.role (admin/member/reader) IS
// load-bearing for board access — it determines a member's natural tier.
// The attachment role caps how high that natural tier can climb on a
// given board. So a clan reader can never become a board editor on a
// board where the attachment ceiling is editor — they're capped down
// to viewer by their own clan tier. Conversely, a clan admin attached
// at "viewer" is still just a viewer.
//
// Tier mapping:  admin → owner, member → editor, reader → viewer.
export const boardClans = pgTable(
  'board_clans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    boardId: uuid('board_id')
      .notNull()
      .references(() => boards.id, { onDelete: 'cascade' }),
    clanId: uuid('clan_id')
      .notNull()
      .references(() => clans.id, { onDelete: 'cascade' }),
    role: boardRoleEnum('role').notNull().default('editor'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    // A clan can only be attached to a given board once. Changing the
    // role uses UPDATE, not a second row.
    uniqueBoardClan: unique('board_clans_board_clan_unique').on(t.boardId, t.clanId),
  }),
);
