import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { authUsers } from './auth';

/**
 * The application identity. Every other table in the schema FKs to
 * `profiles.id`, so this UUID is the stable key across the whole app and is
 * deliberately independent of whoever is providing authentication.
 *
 * `userId` → `auth_users.id` is the bridge to Better Auth. `clerkUserId` is
 * the same bridge to the outgoing Clerk instance; both exist during the
 * migration window so a rollback stays possible, and `clerkUserId` is dropped
 * ~14 days after cutover.
 */
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().unique().references(() => authUsers.id),
  // DEPRECATED — dropped once the Better Auth cutover is past its rollback
  // window. Nullable so accounts created after cutover don't need a fake one.
  clerkUserId: text('clerk_user_id').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  bio: text('bio'),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
