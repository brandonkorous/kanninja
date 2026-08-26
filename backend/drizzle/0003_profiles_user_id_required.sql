-- Locks in the Better Auth link. DO NOT APPLY until
--   pnpm --filter @kanninja/backend run backfill-profile-user-id
-- reports a clean gate (0 null user_id, 0 dangling refs, 0 duplicate hashes).
--
-- Applying this against a half-backfilled table fails on the NOT NULL and
-- leaves the migration journal ahead of reality.

ALTER TABLE "profiles" ALTER COLUMN "user_id" SET NOT NULL;
