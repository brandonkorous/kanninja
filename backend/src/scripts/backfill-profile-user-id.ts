/**
 * Links existing profiles to their imported Better Auth users.
 *
 *   pnpm --filter @kanninja/backend run backfill-profile-user-id -- --dry-run
 *   pnpm --filter @kanninja/backend run backfill-profile-user-id
 *
 * Runs AFTER migrate-clerk-users.ts. Because that script seeds
 * `auth_users.id` with the Clerk user id, this is a single UPDATE with no
 * join and no lookup table.
 *
 * Refuses to proceed if any profile would be left unlinked, because the next
 * migration adds `NOT NULL` to `profiles.user_id` and would fail against a
 * half-backfilled table. Orphans have to be a deliberate decision, made now
 * rather than discovered during the cutover window.
 */

import { sql } from 'drizzle-orm';
import { db } from '../db/index.js';

interface OrphanRow extends Record<string, unknown> {
  id: string;
  email: string;
  clerk_user_id: string | null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  // --- pre-flight ----------------------------------------------------
  // Profiles whose clerk_user_id has no matching auth_users row. Usually a
  // user deleted in Clerk whose profile survived: the old `user.deleted`
  // webhook did a bare DELETE that fails on the FKs from 35 other tables, so
  // failures there left the profile behind.
  const orphans = await db.execute<OrphanRow>(sql`
    SELECT p.id, p.email, p.clerk_user_id
      FROM profiles p
      LEFT JOIN auth_users u ON u.id = p.clerk_user_id
     WHERE p.user_id IS NULL
       AND (p.clerk_user_id IS NULL OR u.id IS NULL)
     ORDER BY p.created_at
  `);

  if (orphans.length > 0) {
    console.error(`\n✗ ${orphans.length} profile(s) have no matching auth_users row:\n`);
    for (const row of orphans.slice(0, 20)) {
      console.error(`   ${row.id}  ${row.email}  clerk_user_id=${row.clerk_user_id ?? 'NULL'}`);
    }
    if (orphans.length > 20) console.error(`   … and ${orphans.length - 20} more`);
    console.error(
      '\nResolve before continuing. Either:\n' +
        '  a) re-run migrate-clerk-users.ts if the Clerk export was incomplete, or\n' +
        '  b) delete the dead profiles, or\n' +
        '  c) create stub auth_users rows for them.\n' +
        'Do NOT apply the NOT NULL migration until this returns clean.\n',
    );
    process.exit(1);
  }

  const [{ count: pending }] = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count FROM profiles WHERE user_id IS NULL
  `);

  console.log(`${pending} profile(s) to link.`);

  if (dryRun) {
    console.log('[dry-run] no changes written.');
    return;
  }

  if (pending > 0) {
    await db.execute(sql`
      UPDATE profiles SET user_id = clerk_user_id, updated_at = now()
       WHERE user_id IS NULL AND clerk_user_id IS NOT NULL
    `);
  }

  // --- gate ----------------------------------------------------------
  // Both must be zero before the NOT NULL + FK migration can be applied.
  const [{ count: stillNull }] = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count FROM profiles WHERE user_id IS NULL
  `);
  const [{ count: dangling }] = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count
      FROM profiles p LEFT JOIN auth_users u ON u.id = p.user_id
     WHERE u.id IS NULL
  `);

  // Sanity check on the password import: bcrypt digests embed a per-row random
  // salt, so duplicates mean the import copied one hash across several users —
  // which would also make the rehash-on-login UPDATE hit the wrong rows.
  const [{ count: dupeHashes }] = await db.execute<{ count: number }>(sql`
    SELECT count(*)::int AS count FROM (
      SELECT password FROM auth_accounts
       WHERE provider_id = 'credential' AND password IS NOT NULL
       GROUP BY password HAVING count(*) > 1
    ) d
  `);

  console.log('\n--- gate ---');
  console.log(`profiles.user_id IS NULL        : ${stillNull}   (must be 0)`);
  console.log(`profiles with no auth_users row : ${dangling}   (must be 0)`);
  console.log(`duplicate credential hashes     : ${dupeHashes}   (must be 0)`);

  if (stillNull !== 0 || dangling !== 0 || dupeHashes !== 0) {
    console.error('\n✗ Gate failed. Do not apply the NOT NULL migration.');
    process.exit(1);
  }

  console.log('\n✓ Backfill clean. Safe to apply 0003_profiles_user_id_required.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
