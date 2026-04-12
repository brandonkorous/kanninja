import { pgTable, uuid, text, timestamp, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

// The role enum is still used — it now lives on the `board_clans`
// attachment rows (replacing the dropped `board_members` table) and as
// the effective-role signal returned from the require-board-role
// middleware.
export const boardRoleEnum = pgEnum('board_role', ['owner', 'editor', 'viewer']);

export const boards = pgTable('boards', {
  id: uuid('id').defaultRandom().primaryKey(),
  // The creator — always has 'owner' access, can always attach/detach
  // clans. Boards with zero attached clans are personal (creator only).
  userId: uuid('user_id').notNull().references(() => profiles.id),
  title: text('title').notNull(),
  description: text('description'),
  financialTrackingEnabled: boolean('financial_tracking_enabled').default(false).notNull(),
  projectBudget: numeric('project_budget'),
  projectValueGoal: numeric('project_value_goal'),
  currencyCode: text('currency_code').default('USD').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
