/**
 * Imports Clerk users into Better Auth's tables.
 *
 *   pnpm --filter @kanninja/backend run migrate-clerk-users -- --dry-run
 *   pnpm --filter @kanninja/backend run migrate-clerk-users
 *
 * Reads users from the Clerk Backend API (CLERK_SECRET_KEY). Password digests
 * are NOT available there — they only appear in the Dashboard CSV export, and
 * on some plans only after a support request. Point --passwords at that CSV to
 * carry passwords over; omit it and users keep their accounts but must reset.
 *
 *   ... -- --passwords ./exported_users.csv
 *
 * Idempotent and resumable: every write is create-then-fall-back-to-read, and
 * each user is logged as a JSONL line so two runs can be diffed. Safe to
 * re-run for a delta import after the cutover.
 *
 * What it does NOT do: create `profiles` rows. That's the backfill script
 * (backfill-profile-user-id.ts), which runs second.
 */

import { readFileSync, appendFileSync } from 'node:fs';
import { auth } from '../lib/auth.js';
import { env } from '../config/env.js';

const CLERK_API = 'https://api.clerk.com/v1';
const PAGE_SIZE = 100;

interface ClerkEmailAddress {
  id: string;
  email_address: string;
  verification?: { status?: string } | null;
}

interface ClerkExternalAccount {
  provider?: string;
  provider_user_id?: string;
  approved_scopes?: string;
}

interface ClerkUser {
  id: string;
  primary_email_address_id: string | null;
  email_addresses: ClerkEmailAddress[];
  external_accounts: ClerkExternalAccount[];
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: number;
  updated_at: number;
}

interface Options {
  dryRun: boolean;
  passwordsCsv: string | null;
  logPath: string;
}

function parseArgs(): Options {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | null => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : null;
  };
  return {
    dryRun: argv.includes('--dry-run'),
    passwordsCsv: get('--passwords'),
    logPath: get('--log') ?? 'migrate-clerk-users.jsonl',
  };
}

/**
 * Minimal CSV reader for the Clerk export. Handles quoted fields with embedded
 * commas and doubled quotes — bcrypt digests contain `$` and `/` but the
 * surrounding export is ordinary RFC 4180.
 */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows.filter((r) => r.some((c) => c !== ''));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}

/** clerk_user_id → bcrypt digest, from the Dashboard CSV export. */
function loadPasswordDigests(csvPath: string): Map<string, string> {
  const rows = parseCsv(readFileSync(csvPath, 'utf8'));
  const digests = new Map<string, string>();
  let skippedHasher = 0;

  for (const row of rows) {
    const id = row.id || row.user_id;
    const digest = row.password_digest;
    const hasher = row.password_hasher;
    if (!id || !digest) continue;

    // Better Auth's verify hook only understands bcrypt. Clerk can also emit
    // argon2/pbkdf2/scrypt-firebase depending on where the user came from
    // originally; importing those would silently lock people out.
    if (hasher && !hasher.startsWith('bcrypt')) {
      skippedHasher++;
      continue;
    }
    digests.set(id, digest);
  }

  console.log(`Loaded ${digests.size} bcrypt digests from ${csvPath}`);
  if (skippedHasher > 0) {
    console.warn(
      `⚠ Skipped ${skippedHasher} non-bcrypt digests. Those users must reset their password.`,
    );
  }
  return digests;
}

async function* fetchClerkUsers(): AsyncGenerator<ClerkUser> {
  let offset = 0;
  for (;;) {
    const response = await fetch(
      `${CLERK_API}/users?limit=${PAGE_SIZE}&offset=${offset}&order_by=%2Bcreated_at`,
      { headers: { Authorization: `Bearer ${env.CLERK_SECRET_KEY}` } },
    );
    if (!response.ok) {
      throw new Error(`Clerk API ${response.status}: ${await response.text()}`);
    }
    const page = (await response.json()) as ClerkUser[];
    if (page.length === 0) return;
    for (const user of page) yield user;
    if (page.length < PAGE_SIZE) return;
    offset += PAGE_SIZE;
  }
}

function primaryEmail(user: ClerkUser): ClerkEmailAddress | null {
  return (
    user.email_addresses.find((e) => e.id === user.primary_email_address_id) ??
    user.email_addresses[0] ??
    null
  );
}

async function main() {
  const options = parseArgs();

  if (!env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is required to read users from Clerk.');
  }

  const digests = options.passwordsCsv ? loadPasswordDigests(options.passwordsCsv) : new Map();
  if (!options.passwordsCsv) {
    console.warn(
      '⚠ No --passwords CSV supplied. Users will be imported WITHOUT passwords and\n' +
        '  must use "Forgot password" to sign in. Google users are unaffected.\n',
    );
  }

  const ctx = await auth.$context;
  const stats = {
    users: 0,
    usersCreated: 0,
    usersExisting: 0,
    google: 0,
    credentials: 0,
    noEmail: 0,
    failed: 0,
  };

  for await (const clerkUser of fetchClerkUsers()) {
    stats.users++;
    const email = primaryEmail(clerkUser);

    if (!email) {
      // Better Auth requires an email. Nothing sensible to import.
      stats.noEmail++;
      console.warn(`  skip ${clerkUser.id}: no email address`);
      continue;
    }

    // Better Auth requires a non-null name; fall back to the email local-part,
    // matching what the sign-up form does for new accounts.
    const name =
      [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ').trim() ||
      email.email_address.split('@')[0];

    const record = {
      clerkUserId: clerkUser.id,
      email: email.email_address,
      google: false,
      credential: false,
      created: false,
    };

    if (options.dryRun) {
      record.google = clerkUser.external_accounts.some((a) => a.provider === 'oauth_google');
      record.credential = digests.has(clerkUser.id);
      console.log(`  [dry-run] ${JSON.stringify(record)}`);
      continue;
    }

    try {
      // --- user -------------------------------------------------------
      // Seeded with the Clerk id so the profiles backfill is one UPDATE.
      let userId: string;
      const existing = await ctx.adapter.findOne<{ id: string }>({
        model: 'user',
        where: [{ field: 'id', value: clerkUser.id }],
      });

      if (existing) {
        userId = existing.id;
        stats.usersExisting++;
      } else {
        const created = await ctx.adapter.create<Record<string, unknown>, { id: string }>({
          model: 'user',
          forceAllowId: true,
          data: {
            id: clerkUser.id,
            email: email.email_address,
            emailVerified: email.verification?.status === 'verified',
            name,
            image: clerkUser.image_url,
            createdAt: new Date(clerkUser.created_at),
            updatedAt: new Date(clerkUser.updated_at),
          },
        });
        userId = created.id;
        stats.usersCreated++;
        record.created = true;
      }

      // --- google account ---------------------------------------------
      // `provider_user_id` IS the Google `sub`. If it ever fails to match what
      // our own OAuth client receives, account linking (trustedProviders:
      // ['google'] in lib/auth.ts) creates the row lazily on first sign-in
      // instead — so a mismatch degrades to a no-op, not data loss.
      const googleAccount = clerkUser.external_accounts.find(
        (a) => a.provider === 'oauth_google' && a.provider_user_id,
      );
      if (googleAccount) {
        await upsertAccount(ctx, {
          userId,
          providerId: 'google',
          accountId: googleAccount.provider_user_id!,
          scope: googleAccount.approved_scopes ?? null,
        });
        stats.google++;
        record.google = true;
      }

      // --- credential account -----------------------------------------
      // Emitted OUTSIDE the external-accounts branch on purpose. Better
      // Auth's own migration guide creates it inside that loop, which leaves
      // any password-only user with no account row and therefore no way to
      // sign in at all.
      const digest = digests.get(clerkUser.id);
      if (digest) {
        await upsertAccount(ctx, {
          userId,
          providerId: 'credential',
          accountId: userId,
          password: digest,
        });
        stats.credentials++;
        record.credential = true;
      }

      appendFileSync(options.logPath, `${JSON.stringify({ ...record, ok: true })}\n`);
    } catch (error) {
      stats.failed++;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  FAIL ${clerkUser.id} (${email.email_address}): ${message}`);
      appendFileSync(
        options.logPath,
        `${JSON.stringify({ ...record, ok: false, error: message })}\n`,
      );
    }

    if (stats.users % 50 === 0) console.log(`  … ${stats.users} users processed`);
  }

  console.log('\n--- import summary ---');
  console.table(stats);

  if (stats.failed > 0) {
    console.error(
      `\n${stats.failed} user(s) failed. Re-run to retry — the script is idempotent.`,
    );
    process.exitCode = 1;
    return;
  }

  if (!options.dryRun) {
    console.log('\nNext: pnpm --filter @kanninja/backend run backfill-profile-user-id');
  }
}

type AuthContext = Awaited<typeof auth.$context>;

async function upsertAccount(
  ctx: AuthContext,
  data: {
    userId: string;
    providerId: string;
    accountId: string;
    password?: string;
    scope?: string | null;
  },
) {
  const existing = await ctx.adapter.findOne<{ id: string }>({
    model: 'account',
    where: [
      { field: 'userId', value: data.userId },
      { field: 'providerId', value: data.providerId },
    ],
  });
  if (existing) return;

  await ctx.adapter.create({
    model: 'account',
    data: { ...data, createdAt: new Date(), updatedAt: new Date() },
  });
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
