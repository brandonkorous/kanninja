# Migration runbook — Clerk → Better Auth, Supabase → Azure

Operational companion to the code changes. Everything here needs credentials
this repo doesn't have, so it is written to be executed by a human, in order.

Three independent tracks. **Do the database last**, against a codebase already
de-risked by the other two.

```
Prep ──┬──► A. Storage   ──┐
       ├──► B. Realtime  ──┼──► cleanup
       ├──► D. Auth      ──┤
       └──► C. Database  ──┘
```

---

## Two hard gates — resolve before anything else

### Gate 1 — Clerk password digests

Clerk Dashboard → Users → Export. Confirm `password_digest` and
`password_hasher` are **populated**; on some plans this needs a support
request.

- **Populated, `bcrypt*`** → pass the CSV to the import; passwords carry over
  and are silently upgraded to scrypt as people sign in.
- **Absent, or a non-bcrypt hasher** → skip `--passwords`. Users keep their
  accounts and their Google sign-in, but password users must use "Forgot
  password". Mail them before cutover and put a banner on `/sign-in` for two
  weeks. Do **not** build a "does this account need a reset?" endpoint — that
  is an email-enumeration oracle.

This decision cannot be made mid-cutover. Make it first.

### Gate 2 — GKE static egress IPs

Azure Postgres will use public access + a firewall allowlist. That only works
if `sparx-prod-autopilot` egresses through Cloud NAT with **reserved** IPs:

```bash
gcloud compute routers nats list --router-region us-central1 --project sparxworks
gcloud compute routers nats describe <NAT> --router <ROUTER> --region us-central1 \
  --project sparxworks --format='value(natIps,natIpAllocateOption)'
```

If `natIpAllocateOption` is `AUTO_ONLY`, reserve static IPs and switch to
`MANUAL_ONLY` first. **Hard blocker for track C.**

### Also do now

Send the DPA subprocessor notice — it's the only item on an external clock.
Supabase leaves the list; Microsoft Azure joins it (database + blob storage);
Google Cloud stays (application hosting); Resend joins it (transactional email).

---

## Track D — Auth

### Phase 0 — prerequisites

1. **Resend**: add `kanninja.com`, publish SPF/DKIM/DMARC. **≥48h before
   cutover** — DNS propagation is not something to discover on the day.
2. **Google Cloud Console**: a *new* OAuth client for sign-in, separate from
   the Calendar/Drive integration client. Scopes `openid email profile`.
   Redirect URIs:
   - `https://api.kanninja.com/api/auth/callback/google`
   - `http://localhost:3001/api/auth/callback/google`
3. **GitHub Actions secrets**: `BETTER_AUTH_SECRET` (`openssl rand -base64 32`),
   `GOOGLE_AUTH_CLIENT_ID`, `GOOGLE_AUTH_CLIENT_SECRET`, `RESEND_API_KEY`.

### Phase 1 — additive backend (zero user impact)

Better Auth is deployed but nothing points at it; Clerk still owns
`require-auth`.

```bash
# On the CURRENT production database.
#
# The migration chain was re-baselined (see "Migration state" below), so first
# tell drizzle that 0000 and 0001 are already applied — production has that
# schema and that seed data. Without this the baseline tries to CREATE TABLE
# over live tables.
psql "$DATABASE_URL" -c "SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;"
```

Mark the baseline as applied, then run the real migration:

```bash
# Replace the old journal rows with two synthetic ones matching 0000/0001.
# Hashes come from drizzle/meta/_journal.json.
psql "$DATABASE_URL" <<'SQL'
BEGIN;
DELETE FROM drizzle.__drizzle_migrations;
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES
  ('0000_baseline',                  extract(epoch from now())*1000 - 2),
  ('0001_seed_integration_providers', extract(epoch from now())*1000 - 1);
COMMIT;
SQL

pnpm --filter @kanninja/backend run db:migrate   # applies 0002 only
```

> `0002` creates the four `auth_*` tables, adds `profiles.user_id`, and — the
> part that is easy to miss — drops `NOT NULL` from `profiles.clerk_user_id`.
> That last change is **required**: a Better Auth signup has no Clerk id, so
> without it every new account fails to insert.

Deploy the backend. `/api/auth/*` is live but unused.

**Verify against production before going further.** This is the step that
de-risks everything:

```bash
API=https://api.kanninja.com

# Sign up. Expect 200 and a Set-Cookie with Domain=.kanninja.com; Secure; HttpOnly.
curl -isS -X POST "$API/api/auth/sign-up/email" \
  -H 'content-type: application/json' \
  -d '{"email":"migration-test@example.com","password":"correct horse battery","name":"Test"}'

# Confirm the verification code email actually arrives.
# Confirm the profile + personal clan + admin membership rows appeared:
psql "$DATABASE_URL" -c "
  SELECT p.id, p.user_id, c.name, cm.role
    FROM profiles p
    JOIN clan_members cm ON cm.user_id = p.id
    JOIN clans c ON c.id = cm.clan_id AND c.is_personal
   WHERE p.email = 'migration-test@example.com';"

# Google round trip — open in a browser, confirm it lands back signed in:
open "$API/api/auth/sign-in/social?provider=google"
```

Delete the test user afterwards.

### Phase 2 — data migration (still zero user impact)

1. **Freeze Clerk sign-ups** (Clerk Dashboard → restrictions). Note the time.
2. Export the CSV (Gate 1) and dry-run:

```bash
cd backend
pnpm run migrate-clerk-users -- --dry-run --passwords ./exported_users.csv
pnpm run migrate-clerk-users -- --passwords ./exported_users.csv
```

Before the bulk run, **test one real Google account in staging**. The import
maps Clerk's `provider_user_id` to Google's `sub`; if that ever failed to match
what our own OAuth client receives, every Google user would silently get a
duplicate. Account linking (`trustedProviders: ['google']`) degrades a mismatch
to "linked lazily on first sign-in" rather than data loss, but prove it.

3. Backfill and gate:

```bash
pnpm run backfill-profile-user-id -- --dry-run
pnpm run backfill-profile-user-id
```

It refuses to proceed if any profile would be left unlinked. Orphans are
usually users deleted in Clerk whose profile survived (the old `user.deleted`
webhook did a bare `DELETE` that fails against 35 foreign keys). Resolve them
by hand **now**, not during the window.

4. Only once the gate is clean:

```bash
pnpm run db:migrate   # applies 0003 — NOT NULL on profiles.user_id
```

### Phase 3 — cutover (~30 minutes)

**Every browser session dies here.** There is no dual-session story: the
frontend ships one auth client. Plan for a forced re-login of 100% of users.

1. Deploy backend + frontend together (`CLERK_SECRET_KEY` stays set — the
   legacy branch is the rollback).
2. Re-run the import delta for anyone created since the freeze:
   `pnpm run migrate-clerk-users -- --passwords ./exported_users.csv`
3. Smoke: password sign-in · Google sign-in · fresh sign-up + code · forgot
   password · an `ninja_live_*` API-key call · an MCP-JWT call · the full MCP
   consent flow (agent → consent → allow → tool call).

### Phase 4 — cleanup

- **T+7d** — delete the legacy Clerk branch from `require-auth.ts`, remove
  `@clerk/fastify`, `svix`, `routes/auth/webhooks.ts`, and the `CLERK_*`
  secrets. Watch the bcrypt→scrypt migration finish first:

  ```sql
  SELECT count(*) FROM auth_accounts
   WHERE provider_id = 'credential' AND password LIKE '$2%';
  ```

  When it plateaus, force-reset the stragglers.
- **T+14d** — drop `profiles.clerk_user_id`, remove `img.clerk.com` from
  `next.config.ts`, delete the Clerk instance. **Take a final export first.**

> **Avatars.** Existing `profiles.avatar_url` values point at `img.clerk.com`
> and die with the Clerk instance. Either backfill them into Blob Storage or
> accept that avatars fall back to initials. Decide deliberately.

**Rollback window after the frontend deploys is ~4 hours.** Reverting both
deploys works while `clerk_user_id` is still populated and Clerk is still live
— but anyone who signed up in the Better Auth window has no `clerk_user_id`
and will 401. `require-auth.ts` deliberately rejects them rather than creating
a second profile and forking their data. Keep the window short; after that,
fix forward.

---

## Track A — Storage

```bash
az storage account create -g rg-kanninja-prod -n kanninjaprod \
  --location centralus --sku Standard_LRS --kind StorageV2 \
  --min-tls-version TLS1_2 --allow-blob-public-access false

az storage container create --account-name kanninjaprod -n card-attachments

# CORS lives on the ACCOUNT, not the container. Without it the browser's
# PUT/GET is blocked at preflight even with a valid SAS.
az storage cors add --account-name kanninjaprod --services b \
  --methods GET PUT OPTIONS --origins https://kanninja.com \
  --allowed-headers '*' --exposed-headers '*' --max-age 3600
```

Copy the existing objects — **copy, not move**; the Supabase bucket is the
rollback:

```bash
rclone copy supabase:card-attachments azure:card-attachments --progress
```

`file_path` values do not need rewriting: they're relative keys and the
container is the new root.

Then deploy. Verify a *legacy* attachment downloads, and that a fresh upload
round-trips.

> This change also closes a pre-existing IDOR. `attachments.ts` previously
> looked attachments up by id alone while `requireBoardRole` only validated
> the `:boardId` in the URL, so quoting a board you own plus someone else's
> attachment id read or deleted across the tenant boundary. The list endpoint
> had the same hole via an unvalidated `:cardId`. Both now join back through
> `cards → lists → boards`. File names are sanitised too — they used to be
> interpolated into the storage path unchecked.

---

## Track B — Realtime

No infrastructure. Deploy backend then frontend; the backend serves both the
new WebSocket route and the old broadcast path during the gap.

Smoke with **two browsers on one board**: presence appears in both, a card
move in one refreshes the other, and `kubectl rollout restart deploy/backend`
is followed by automatic reconnection (exponential backoff with jitter).

**Do not scale `replicas` above 1** — see the comment on
`k8s/backend-deployment.yaml`. The hub fans out per-pod; a second replica
makes broadcasts silently partial. Redis pub/sub is the seam, in
`realtimeHub.publish`.

---

## Track C — Database

### Provision

```bash
az postgres flexible-server create \
  --resource-group rg-kanninja-prod --name kanninja-prod-pg \
  --location centralus --version 17 \
  --tier GeneralPurpose --sku-name Standard_D2ds_v5 \
  --storage-size 64 --storage-auto-grow Enabled \
  --backup-retention 14 --public-access None --database-name kanninja
```

- **`centralus`** (Des Moines) colocates with GKE `us-central1` (Council
  Bluffs) — ~5–10 ms. `westus3` would be ~40 ms, and a board load is ≥3 serial
  round trips, so the region choice is a 5× difference on the same code.
- **Burstable/B-series is a trap**: it caps `max_connections` near 35–50 and
  throttles IOPS on credit exhaustion.
- `gen_random_uuid()` has been in `pg_catalog` since PG 13 — no extension
  needed. Verify Supabase didn't store defaults as `extensions.gen_random_uuid()`:

  ```sql
  SELECT c.relname, a.attname, pg_get_expr(d.adbin, d.adrelid)
    FROM pg_attrdef d
    JOIN pg_class c ON c.oid = d.adrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = d.adrelid AND a.attnum = d.adnum
   WHERE n.nspname = 'public' AND pg_get_expr(d.adbin, d.adrelid) ILIKE '%uuid%';
  ```

  Schema comes from the drizzle baseline either way, which emits the bare form.

Firewall each Cloud NAT static IP, plus a **time-boxed rule for your
workstation that you delete in cleanup**.

### Dump and restore

Exclude Supabase-owned schemas and all ownership/ACL flags. **There are zero
sequences** — every PK is `uuid DEFAULT gen_random_uuid()` — which removes an
entire category of `setval` reconciliation risk.

```bash
# 0. Capture row counts to match later.
psql "$SUPABASE_URL" -Atc "
  SELECT relname, n_live_tup FROM pg_stat_user_tables
   WHERE schemaname='public' ORDER BY relname;" > before.txt

# 1. Schema from the DRIZZLE BASELINE, not the dump — so drizzle's migration
#    state is provably correct on arrival.
DATABASE_URL="$AZURE_URL" pnpm --filter @kanninja/backend run db:migrate

# 2. Save FK DDL, then drop the FKs so a data-only restore can't hit ordering.
psql "$AZURE_URL" -Atc "
  SELECT 'ALTER TABLE '||conrelid::regclass||' ADD CONSTRAINT '||conname||' '||
         pg_get_constraintdef(oid)||';'
    FROM pg_constraint WHERE contype='f'
     AND connamespace='public'::regnamespace;" > fks.sql
psql "$AZURE_URL" -Atc "
  SELECT 'ALTER TABLE '||conrelid::regclass||' DROP CONSTRAINT '||conname||';'
    FROM pg_constraint WHERE contype='f'
     AND connamespace='public'::regnamespace;" | psql "$AZURE_URL"

# 3. The seed rows would collide with the dump's integration_providers.
psql "$AZURE_URL" -c "TRUNCATE integration_providers CASCADE;"

# 4. Data.
pg_dump "$SUPABASE_URL" --data-only --schema=public \
  --no-owner --no-acl --no-privileges -Fc -f data.dump
pg_restore -d "$AZURE_URL" --data-only --disable-triggers --jobs=4 data.dump

# 5. Re-add FKs. ANY failure here IS the referential-integrity report.
psql "$AZURE_URL" -f fks.sql

# 6. Azure has no statistics until you say so, and the first queries will pick
#    terrible plans across an 8ms link without them.
psql "$AZURE_URL" -c "ANALYZE;"
```

### Verify

```bash
psql "$AZURE_URL" -Atc "
  SELECT relname, n_live_tup FROM pg_stat_user_tables
   WHERE schemaname='public' ORDER BY relname;" > after.txt
diff before.txt after.txt   # expect only the auth_* tables to be new
```

Also spot-check the types that would fail quietly: a `jsonb` column, a
`text[]` column (`api_keys.scopes`), and fractional-index ordering
(`SELECT order_index FROM cards ORDER BY order_index LIMIT 20`).

### Cutover

**Rehearse a week early on a throwaway server. Time it.** Then:

1. Freeze writes (scale backend to 0, or maintenance mode).
2. Dump → restore → verify counts.
3. Flip `DATABASE_URL` — **GitHub Actions secret first**, then the live k8s
   Secret. `deploy.yml` regenerates the whole Secret imperatively on every
   push, so a k8s-only patch is reverted by the next deploy.
4. Scale back up, smoke, thaw the CronJob.

**Point of no return: the first successful write on Azure.** Everything before
it is undone by flipping `DATABASE_URL` back.

**Keep the Supabase project for 30 days.** It is the only real safety net.

---

## Migration state — what changed and why

`backend/drizzle/` was re-baselined. The old chain had 14 SQL files but
`meta/_journal.json` listed only `0000`–`0008`: five files were hand-written
and applied out-of-band through the Supabase SQL editor, so `db:migrate` had
never run them. There were also filename collisions (two `0004_*`, two
`0006_*`), making "just replay the folder" ambiguous.

Now:

| File | Contents |
|---|---|
| `0000_baseline.sql` | All 36 tables + 7 enums, squashed. Verified equivalent to replaying the old chain. |
| `0001_seed_integration_providers.sql` | The 27 providers, merged from the two orphaned seed files, `ON CONFLICT (id) DO NOTHING` — and actually journaled this time. |
| `0002_better_auth_tables.sql` | `auth_*` tables, `profiles.user_id`, `clerk_user_id` made nullable. |
| `0003_profiles_user_id_required.sql` | `NOT NULL`. Gated on the backfill script. |

The old files are preserved in `backend/drizzle-legacy/` for reference; they
are outside the migrator's path and are never executed.

`0009_enable_rls.sql` was **dropped** rather than carried over. It was a
plpgsql `DO` block enabling RLS on every table with **zero policies**, added
purely to silence Supabase's advisor; the connecting role bypassed it anyway.
It has no meaning on Azure, and re-running it would have silently enabled RLS
on the new `auth_*` tables.
