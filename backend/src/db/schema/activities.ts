import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { boards } from './boards';
import { profiles } from './profiles';

export const auditActionTypeEnum = pgEnum('audit_action_type', [
  'create',
  'update',
  'delete',
  'login',
  'logout',
  'invite',
  'join',
  'export',
  'import',
  'settings_change',
  'permission_change',
]);

export const boardActivities = pgTable('board_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  boardId: uuid('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  activityType: text('activity_type').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  activityData: jsonb('activity_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id),
  actionType: auditActionTypeEnum('action_type').notNull(),
  tableName: text('table_name'),
  recordId: uuid('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  sessionId: text('session_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
