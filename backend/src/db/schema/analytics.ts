import { pgTable, uuid, text, timestamp, numeric, jsonb } from 'drizzle-orm/pg-core';
import { boards } from './boards';
import { profiles } from './profiles';

export const aiInteractions = pgTable('ai_interactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  query: text('query').notNull(),
  responseType: text('response_type').notNull(),
  context: jsonb('context'),
  confidenceScore: numeric('confidence_score'),
  feedbackRating: text('feedback_rating'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const analyticsSnapshots = pgTable('analytics_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').references(() => boards.id, { onDelete: 'cascade' }),
  snapshotType: text('snapshot_type').notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projectExpenses = pgTable('project_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  amount: numeric('amount').notNull(),
  currency: text('currency').default('USD').notNull(),
  category: text('category'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
