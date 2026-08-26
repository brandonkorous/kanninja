import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/**
 * Better Auth's own tables. These are the *credential* store — they answer
 * "who is signing in". `profiles` remains the *application* identity: every
 * other table in the schema keys on `profiles.id`, and none of them know these
 * tables exist. The bridge is `profiles.user_id` → `auth_users.id`.
 *
 * Two conventions are load-bearing and cannot be changed casually:
 *
 * 1. The JS property names (`emailVerified`, `userId`, `expiresAt`, …) must
 *    match Better Auth's field names exactly — the Drizzle adapter resolves
 *    columns via `schemaModel[fieldName]`, so a rename here breaks it at
 *    runtime, not at compile time. The SQL column names are free, so they
 *    follow the repo's snake_case convention.
 * 2. The *table* names are ours, mapped in `lib/auth.ts` via the adapter's
 *    `schema: { user: authUsers, … }` option (keyed by Better Auth model
 *    name). Better Auth's default table name is `user`, which is a SQL
 *    reserved word — it works because Drizzle quotes it, but it's a trap in
 *    hand-written psql and in `DO`-block loops over `pg_class`. Hence
 *    `auth_users`.
 *
 * Field list generated from `getAuthTables()` at better-auth 1.6.26. Re-check
 * it after any minor upgrade — Better Auth adds columns between minors.
 */

export const authUsers = pgTable('auth_users', {
  // Not a uuid: Better Auth generates base62 ids, and the Clerk import seeds
  // this column with Clerk's `user_2abc…` ids so the profiles backfill is a
  // single UPDATE with no join. Mixed id shapes here are expected.
  id: text('id').primaryKey(),
  // Required by Better Auth (not nullable). The Clerk import falls back to the
  // email local-part for users with no first/last name.
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const authSessions = pgTable('auth_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  // Better Auth always supplies this on write; no DB default by design.
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const authAccounts = pgTable('auth_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  // For `providerId: 'credential'` this is the user id; for social providers
  // it's the provider's subject claim (Google's `sub`).
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
  scope: text('scope'),
  // Password hash. Scrypt for anything Better Auth wrote; bcrypt for rows
  // carried over from Clerk until they're rehashed on first sign-in.
  password: text('password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const authVerifications = pgTable('auth_verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
