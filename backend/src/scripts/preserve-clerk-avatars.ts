/**
 * Copies every Clerk-hosted profile picture into our own storage, before the
 * Clerk instance is deleted and the images stop resolving.
 *
 * A Clerk avatar URL is `https://img.clerk.com/<base64url payload>`, and the
 * payload says which of two very different things it is:
 *
 *   {"type":"proxy","src":"https://images.clerk.dev/oauth_google/img_..."}
 *       A REAL photo the user brought from their Google account. Worth money
 *       to lose. These get copied.
 *
 *   {"type":"default","iid":"ins_...","rid":"user_..."}
 *       Clerk's generated grey-initials placeholder. Not user content at all —
 *       Clerk drew it. Copying it would permanently bake another vendor's
 *       default avatar into kanNINJA, and it would keep overriding the
 *       initials the app already renders in Hanko's own type and colours.
 *       These get NULLed so that fallback takes over.
 *
 * Idempotent: a profile already pointing at our own storage is skipped, so a
 * re-run after a partial failure only does what is left.
 *
 * Run with --dry-run first. It reports exactly what it would do and writes
 * nothing.
 */
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { profiles } from '../db/schema/profiles.js';
import { authUsers } from '../db/schema/auth.js';
import {
  AVATAR_MAX_BYTES,
  buildAvatarPath,
  avatarPublicUrl,
  avatarPathFromUrl,
  extensionForAvatarMime,
  uploadAvatar,
  ensureAvatarsContainer,
} from '../config/azure-storage.js';

const CLERK_IMAGE_HOST = 'img.clerk.com';
const FETCH_TIMEOUT_MS = 20_000;

type Classification =
  | { kind: 'photo' }
  | { kind: 'placeholder' }
  | { kind: 'ours' }
  | { kind: 'foreign'; reason: string };

/** Decides what a stored avatar_url actually is, without fetching it. */
function classify(url: string): Classification {
  if (avatarPathFromUrl(url)) return { kind: 'ours' };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { kind: 'foreign', reason: 'not a URL' };
  }
  if (parsed.hostname !== CLERK_IMAGE_HOST) {
    return { kind: 'foreign', reason: `host ${parsed.hostname}` };
  }

  const encoded = parsed.pathname.replace(/^\//, '');
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    const payload = JSON.parse(json) as { type?: string };
    if (payload.type === 'default') return { kind: 'placeholder' };
    return { kind: 'photo' };
  } catch {
    // Undecodable payload. Treat as a photo and let the fetch decide — the
    // failure mode we care about is discarding a real picture, not copying a
    // placeholder we could have skipped.
    return { kind: 'photo' };
  }
}

async function fetchImage(url: string): Promise<{ bytes: Buffer; mimeType: string }> {
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const mimeType = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!extensionForAvatarMime(mimeType)) throw new Error(`unsupported content-type "${mimeType}"`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0) throw new Error('empty response body');
  if (bytes.length > AVATAR_MAX_BYTES) {
    throw new Error(`${bytes.length} bytes exceeds the ${AVATAR_MAX_BYTES} limit`);
  }
  return { bytes, mimeType };
}

/** profiles.avatar_url and auth_users.image must move together. */
async function writeAvatar(profileId: string, userId: string, url: string | null): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({ avatarUrl: url, updatedAt: new Date() })
      .where(eq(profiles.id, profileId));
    await tx
      .update(authUsers)
      .set({ image: url, updatedAt: new Date() })
      .where(eq(authUsers.id, userId));
  });
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? '=== DRY RUN — nothing will be written ===' : '=== LIVE RUN ===');

  const rows = await db
    .select({
      id: profiles.id,
      userId: profiles.userId,
      email: profiles.email,
      avatarUrl: profiles.avatarUrl,
    })
    .from(profiles);

  const withAvatar = rows.filter((r) => r.avatarUrl);
  console.log(`${rows.length} profiles, ${withAvatar.length} with an avatar URL\n`);

  if (!dryRun && withAvatar.some((r) => classify(r.avatarUrl!).kind === 'photo')) {
    await ensureAvatarsContainer();
  }

  const tally = { copied: 0, cleared: 0, skipped: 0, failed: 0 };

  for (const row of withAvatar) {
    const verdict = classify(row.avatarUrl!);

    if (verdict.kind === 'ours') {
      console.log(`SKIP    ${row.email} — already in our storage`);
      tally.skipped += 1;
      continue;
    }
    if (verdict.kind === 'foreign') {
      console.log(`SKIP    ${row.email} — not a Clerk URL (${verdict.reason})`);
      tally.skipped += 1;
      continue;
    }
    if (verdict.kind === 'placeholder') {
      console.log(`CLEAR   ${row.email} — Clerk's generated placeholder, not a photo`);
      if (!dryRun) await writeAvatar(row.id, row.userId, null);
      tally.cleared += 1;
      continue;
    }

    try {
      const { bytes, mimeType } = await fetchImage(row.avatarUrl!);
      const blobPath = buildAvatarPath(row.id, bytes, mimeType);
      const url = avatarPublicUrl(blobPath);

      if (!dryRun) {
        await uploadAvatar(blobPath, bytes, mimeType);
        await writeAvatar(row.id, row.userId, url);
      }
      console.log(`COPY    ${row.email} — ${bytes.length} bytes ${mimeType} -> ${blobPath}`);
      tally.copied += 1;
    } catch (error) {
      // Keep going. One unreachable image must not strand the others, and the
      // window in which any of them are reachable is closing.
      console.error(`FAILED  ${row.email} — ${(error as Error).message}`);
      tally.failed += 1;
    }
  }

  console.log(
    `\ncopied=${tally.copied} cleared=${tally.cleared} ` +
      `skipped=${tally.skipped} failed=${tally.failed}`,
  );

  // A failure here means a picture was left behind, and the Clerk instance is
  // about to be deleted. Exit non-zero so a Job surfaces it instead of
  // reporting Completed.
  if (tally.failed > 0) process.exitCode = 1;
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
