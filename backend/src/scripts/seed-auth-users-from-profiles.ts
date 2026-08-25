/**
 * Creates Better Auth users from the existing `profiles` table.
 *
 *   pnpm --filter @kanninja/backend run seed-auth-users -- --dry-run
 *   pnpm --filter @kanninja/backend run seed-auth-users
 *
 * This is the RECOVERY path, and the difference from migrate-clerk-users.ts
 * matters: that script treats Clerk as the source of truth and reads users
 * from its API. Use this one when Clerk is unavailable, incomplete, or simply
 * not trustworthy — it reads only from our own database, so it works with
 * Clerk fully offline.
 *
 * What it does NOT carry over: passwords. Clerk holds those and they cannot be
 * reconstructed from `profiles`. Every user therefore arrives with no
 * credential account, and signs back in by either:
 *
 *   - **Google** — auto-links on first sign-in because the email matches and
 *     `trustedProviders: ['google']` is set in lib/auth.ts. No user action
 *     beyond clicking the button.
 *   - **Password reset** — "Forgot password" mails a code to the address
 *     already on the profile. This needs RESEND_API_KEY to be live.
 *
 * Idempotent: skips any profile that already has a user_id, and skips any
 * email that already exists in auth_users. Safe to re-run.
 */

import { eq, isNull, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { authUsers } from '../db/schema/auth.js';

/** Better Auth's default id shape: 32 chars of base62. */
function generateId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/**
 * `auth_users.name` is NOT NULL. Profiles may have no display name, so fall
 * back to the email local-part — the same default the sign-up form uses.
 */
function nameFor(displayName: string | null, email: string): string {
  const trimmed = displayName?.trim();
  if (trimmed) return trimmed;
  return email.split('@')[0];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const pending = await db
    .select({
      id: profiles.id,
      email: profiles.email,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
      clerkUserId: profiles.clerkUserId,
      createdAt: profiles.createdAt,
    })
    .from(profiles)
    .where(isNull(profiles.userId));

  console.log(`${pending.length} profile(s) without an auth user.\n`);

  if (pending.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  // Two profiles sharing an email would collide on auth_users.email (UNIQUE).
  // Surface it rather than letting the second insert fail mid-run: it means a
  // duplicate account, and which one survives is a decision, not a detail.
  const byEmail = new Map<string, typeof pending>();
  for (const p of pending) {
    const key = p.email.toLowerCase();
    byEmail.set(key, [...(byEmail.get(key) ?? []), p]);
  }
  const dupes = [...byEmail.entries()].filter(([, rows]) => rows.length > 1);
  if (dupes.length > 0) {
    console.error('✗ Duplicate emails across profiles — resolve before seeding:\n');
    for (const [email, rows] of dupes) {
      console.error(`   ${email}`);
      for (const r of rows) {
        console.error(`      profile ${r.id}  created ${r.createdAt.toISOString().slice(0, 10)}`);
      }
    }
    console.error(
      '\nDecide which profile keeps the email (the others need it changed or the\n' +
        'profile deleted), then re-run. auth_users.email is UNIQUE.\n',
    );
    process.exit(1);
  }

  let created = 0;
  let linkedExisting = 0;

  for (const profile of pending) {
    const name = nameFor(profile.displayName, profile.email);

    // An auth_users row may already exist from a partial run or from someone
    // signing up in the meantime — adopt it rather than duplicating.
    const [existing] = await db
      .select({ id: authUsers.id })
      .from(authUsers)
      .where(eq(authUsers.email, profile.email))
      .limit(1);

    if (dryRun) {
      console.log(
        `  [dry-run] ${existing ? 'LINK  ' : 'CREATE'} ${profile.email.padEnd(34)} name="${name}"`,
      );
      continue;
    }

    const userId = existing?.id ?? generateId();

    if (!existing) {
      await db.insert(authUsers).values({
        id: userId,
        email: profile.email,
        // These addresses were verified by Clerk at signup. Marking them
        // verified is what lets Google auto-link on first sign-in instead of
        // creating a second account.
        emailVerified: true,
        name,
        image: profile.avatarUrl,
        createdAt: profile.createdAt,
        updatedAt: new Date(),
      });
      created++;
    } else {
      linkedExisting++;
    }

    // Only claim the profile if it is still unclaimed — guards against a
    // concurrent sign-up winning the race.
    await db
      .update(profiles)
      .set({ userId, updatedAt: new Date() })
      .where(and(eq(profiles.id, profile.id), isNull(profiles.userId)));

    console.log(`  ${existing ? 'linked ' : 'created'} ${profile.email}`);
  }

  if (dryRun) {
    console.log('\n[dry-run] no changes written.');
    return;
  }

  const [{ count: remaining }] = await db
    .select({ count: profiles.id })
    .from(profiles)
    .where(isNull(profiles.userId))
    .then((rows) => [{ count: rows.length }]);

  console.log(`\ncreated ${created}, linked ${linkedExisting}, still unlinked ${remaining}`);

  if (remaining === 0) {
    console.log('\n✓ Every profile has an auth user. Safe to apply 0003 (NOT NULL).');
    console.log('  Users sign in with Google, or via "Forgot password" (needs RESEND_API_KEY).');
  } else {
    console.error('\n✗ Some profiles are still unlinked. Do NOT apply 0003 yet.');
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
