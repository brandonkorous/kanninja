import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  numeric,
  integer,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { lists } from './lists';
import { profiles } from './profiles';

export const priorityEnum = pgEnum('priority', ['none', 'low', 'medium', 'high', 'urgent']);

export const cards = pgTable('cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  listId: uuid('list_id').notNull().references(() => lists.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  priority: priorityEnum('priority').default('none').notNull(),
  assigneeId: uuid('assignee_id').references(() => profiles.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  dueDate: timestamp('due_date', { withTimezone: true }),
  orderIndex: text('order_index').notNull(),
  isCompleted: boolean('is_completed').default(false).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  estimatedHours: numeric('estimated_hours'),
  progress: integer('progress').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
