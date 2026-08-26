import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { clans, clanMembers } from '../db/schema/clans.js';
import { eq } from 'drizzle-orm';

/**
 * Everything a new user needs before they can use the app: a profile, a
 * personal clan, and admin membership of it.
 *
 * Extracted from the Clerk webhook so both identity providers share one
 * implementation. During the migration the Clerk webhook still calls this, so
 * the transaction stays exercised in production before Better Auth becomes the
 * only caller.
 */

interface ProvisionInput {
  /** Better Auth `auth_users.id`. The row must already exist. */
  userId: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

/**
 * Names the personal clan after the user's first name (or the email local-part
 * as a fallback). Renameable at any time — this is just a sensible default so
 * it doesn't show up as "Untitled clan".
 */
export function personalClanName(displayName: string | null | undefined, email: string): string {
  if (displayName && displayName.trim()) {
    const first = displayName.trim().split(/\s+/)[0];
    return `${first}'s clan`;
  }
  const local = email.split('@')[0];
  return `${local}'s clan`;
}

/**
 * Creates profile + personal clan + admin membership in a single transaction,
 * so we can never strand a user with a profile but no personal clan (which
 * would leave their boards with no default home).
 *
 * Idempotent on the provider id: if a profile already exists for this
 * `userId`/`clerkUserId`, returns the existing id and provisions nothing. Both
 * write paths (webhook and lazy just-in-time sync) can race, and Better Auth's
 * `databaseHooks` fire on every sign-up including ones the import already
 * created.
 *
 * @returns the `profiles.id` UUID.
 */
export async function provisionProfile(input: ProvisionInput): Promise<string> {
  const { userId, email, displayName = null, avatarUrl = null } = input;

  const existing = await findProfileIdByUserId(userId);
  if (existing) return existing;

  try {
    return await db.transaction(async (tx) => {
      const [profile] = await tx
        .insert(profiles)
        .values({ userId, email, displayName, avatarUrl })
        .returning({ id: profiles.id });

      const [personalClan] = await tx
        .insert(clans)
        .values({
          name: personalClanName(displayName, email),
          createdBy: profile.id,
          isPersonal: true,
        })
        .returning({ id: clans.id });

      await tx.insert(clanMembers).values({
        clanId: personalClan.id,
        userId: profile.id,
        role: 'admin',
      });

      return profile.id;
    });
  } catch (error) {
    // A concurrent caller won the race between the check above and the insert.
    // The unique constraint on user_id is what caught it, so re-reading is
    // guaranteed to find their row.
    const raced = await findProfileIdByUserId(userId);
    if (raced) return raced;
    throw error;
  }
}

async function findProfileIdByUserId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row?.id ?? null;
}
