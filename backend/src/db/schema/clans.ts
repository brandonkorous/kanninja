import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const clanRoleEnum = pgEnum('clan_role', ['admin', 'member', 'reader']);

export const clans = pgTable('clans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').notNull().references(() => profiles.id),
  // True for the auto-created personal clan on signup. Visible in the
  // UI as a first-class citizen (with a subtle tag) but cannot be
  // deleted — it's the anchor for a user's personal boards.
  isPersonal: boolean('is_personal').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clanMembers = pgTable('clan_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  clanId: uuid('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => profiles.id),
  role: clanRoleEnum('role').notNull().default('member'),
  invitedBy: uuid('invited_by').references(() => profiles.id),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clanInvitations = pgTable('clan_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  clanId: uuid('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: clanRoleEnum('role').notNull().default('member'),
  inviteToken: text('invite_token').notNull().unique(),
  invitedBy: uuid('invited_by').notNull().references(() => profiles.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clanSettings = pgTable('clan_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  clanId: uuid('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }).unique(),
  defaultBoardVisibility: text('default_board_visibility').default('private').notNull(),
  allowMemberBoardCreation: boolean('allow_member_board_creation').default(true).notNull(),
  defaultNewMemberRole: clanRoleEnum('default_new_member_role').default('member').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clanRolePermissions = pgTable('clan_role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clanId: uuid('clan_id').notNull().references(() => clans.id, { onDelete: 'cascade' }),
  role: clanRoleEnum('role').notNull(),
  permissionType: text('permission_type').notNull(),
  permissionValue: boolean('permission_value').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
