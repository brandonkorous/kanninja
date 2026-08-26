#!/usr/bin/env bash
# Supabase -> Azure Postgres, data only.
#
# RUNS INSIDE THE CLUSTER, AND ONLY THERE. The target has
# `public_network_access_enabled = false` and lives in a delegated subnet, so no
# laptop and no GitHub-hosted runner can reach it with any connection string.
# The source is public. A pod is the only place both are reachable at once.
#
# The SCHEMA is not copied. It arrives from the drizzle baseline, applied by the
# deploy's db-migrate Job, so drizzle's migration state is provably correct on
# arrival rather than inferred from a dump. This script moves rows into a schema
# that already exists.
#
# WHAT IT COPIES is decided by the TARGET, not the source: the intersection of
# both `public` schemas. That is deliberate. A table present in Supabase and
# absent here is reported loudly and skipped rather than aborting the run — it
# is almost always something Supabase owned that v2 dropped. A table present
# here and absent there is silent: that is the four `auth_*` tables, which are
# new and correctly empty.
#
# `drizzle.__drizzle_migrations` is never copied. It lives in the `drizzle`
# schema, not `public`, so the intersection excludes it — which matters, because
# copying it would overwrite the target's correct migration state with the
# source's pre-baseline history.
#
# NO `--disable-triggers`, AND THAT IS NOT AN OVERSIGHT. The runbook specified
# it. It issues `ALTER TABLE ... DISABLE TRIGGER ALL`, which requires SUPERUSER,
# and the admin of an Azure Flexible Server is not one — the restore would fail
# outright with "permission denied: must be superuser". It is also unnecessary
# twice over: the schema declares no triggers at all, and the foreign keys are
# dropped for the duration anyway.
#
# Usage (inside the pod):
#   migrate-data.sh preflight   what would happen, touching nothing
#   migrate-data.sh run         the migration
#   migrate-data.sh verify      re-compare row counts
#
# Required environment:
#   SOURCE_URL   Supabase connection string
#   TARGET_URL   DATABASE_ADMIN_URL — the OWNER role, not kanninja_app
set -euo pipefail

MODE="${1:-preflight}"
WORK=/tmp/migration
mkdir -p "$WORK"

: "${SOURCE_URL:?SOURCE_URL is required}"
: "${TARGET_URL:?TARGET_URL is required}"

# The table that records what the foreign keys were, IN THE TARGET DATABASE.
#
# WHY A TABLE AND NOT A FILE. Between "drop the FKs" and "put them back" the
# database has no referential integrity and the DDL to restore it exists only in
# this pod. If the pod is evicted in that window — an OOM kill, a node
# reschedule, a `kubectl delete job` by someone tidying up — a file in /tmp goes
# with it, and the FK definitions are gone from a database that now contains
# data. Worse, a naive re-run would regenerate an EMPTY fks.sql (there are no
# FKs left to read) and then restore the data a second time on top of itself.
#
# Keeping it in the target makes the operation restartable and makes the
# half-finished state detectable, which is what the guard in `run` checks.
STATE_TABLE=_kanninja_migration_fks

psql_src() { psql "$SOURCE_URL" -v ON_ERROR_STOP=1 "$@"; }
psql_tgt() { psql "$TARGET_URL" -v ON_ERROR_STOP=1 "$@"; }

say() { printf '\n=== %s ===\n' "$*"; }

# ---------------------------------------------------------------------------
say "Connectivity and versions"
# ---------------------------------------------------------------------------
SRC_VER=$(psql_src -Atc "SHOW server_version;")
TGT_VER=$(psql_tgt -Atc "SHOW server_version;")
DUMP_VER=$(pg_dump --version | awk '{print $3}')
echo "source server : $SRC_VER"
echo "target server : $TGT_VER"
echo "pg_dump client: $DUMP_VER"

# pg_dump refuses a server NEWER than itself, and that check is the whole reason
# this image is pinned to the newest major rather than matched to the source.
# Dumping an older server is supported and normal; the reverse is not.
if [ "${DUMP_VER%%.*}" -lt "${SRC_VER%%.*}" ]; then
  echo "FATAL: pg_dump $DUMP_VER cannot dump a $SRC_VER server. Use a newer postgres image." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
say "Deciding what to copy"
# ---------------------------------------------------------------------------
LIST_SQL="SELECT table_name FROM information_schema.tables
           WHERE table_schema='public' AND table_type='BASE TABLE';"

# `LC_ALL=C sort`, NOT Postgres's ORDER BY, and this is load-bearing.
#
# `comm` requires both inputs sorted in the SAME collation and silently produces
# nonsense otherwise — it does not error, it just reports wrong intersections,
# which here would mean a table quietly not copied. Postgres would sort with the
# database collation (en_US.utf8), which treats punctuation as secondary, while
# `comm` compares bytes. Those disagree on exactly the shape of name this schema
# is full of: under en_US `card_attachments` sorts by "cardattachments", under C
# it sorts by the underscore (0x5F) before `cards`. Sorting both files here, in
# one explicit collation, removes the question.
psql_src -Atc "$LIST_SQL" | LC_ALL=C sort > "$WORK/source-tables.txt"
psql_tgt -Atc "$LIST_SQL" | LC_ALL=C sort > "$WORK/target-tables.txt"

LC_ALL=C comm -12 "$WORK/source-tables.txt" "$WORK/target-tables.txt" > "$WORK/copy.txt"
LC_ALL=C comm -23 "$WORK/source-tables.txt" "$WORK/target-tables.txt" > "$WORK/source-only.txt"
LC_ALL=C comm -13 "$WORK/source-tables.txt" "$WORK/target-tables.txt" > "$WORK/target-only.txt"

echo "source tables : $(wc -l < "$WORK/source-tables.txt")"
echo "target tables : $(wc -l < "$WORK/target-tables.txt")"
echo "will copy     : $(wc -l < "$WORK/copy.txt")"

if [ -s "$WORK/source-only.txt" ]; then
  echo
  echo "IN SUPABASE BUT NOT HERE — these are SKIPPED. Read the list; anything"
  echo "carrying data v2 still needs is a schema bug, not a migration setting:"
  sed 's/^/    /' "$WORK/source-only.txt"
fi
if [ -s "$WORK/target-only.txt" ]; then
  echo
  echo "New here, so correctly empty after this runs (expect the auth_* tables):"
  sed 's/^/    /' "$WORK/target-only.txt"
fi

# ---------------------------------------------------------------------------
say "Source row counts"
# ---------------------------------------------------------------------------
# COUNT(*), not pg_stat_user_tables.n_live_tup. n_live_tup is an ESTIMATE
# maintained by autovacuum: it drifts, it can be stale by thousands of rows on a
# table that was just bulk-loaded, and on a freshly restored target it is
# frequently zero until ANALYZE runs. Comparing an estimate against an exact
# count is how a migration gets declared complete while rows are missing. The
# runbook used n_live_tup; this does not.
: > "$WORK/before.txt"
while read -r t; do
  [ -z "$t" ] && continue
  n=$(psql_src -Atc "SELECT count(*) FROM public.\"$t\";")
  printf '%s\t%s\n' "$t" "$n" >> "$WORK/before.txt"
done < "$WORK/copy.txt"
awk -F'\t' '$2>0 {printf "  %-34s %s\n", $1, $2}' "$WORK/before.txt"
echo "  total rows: $(awk -F'\t' '{s+=$2} END {print s+0}' "$WORK/before.txt")"

if [ "$MODE" = "preflight" ]; then
  say "Preflight only — nothing was changed"
  exit 0
fi

if [ "$MODE" = "verify" ]; then
  say "Target row counts"
  bad=0
  while IFS=$'\t' read -r t expected; do
    actual=$(psql_tgt -Atc "SELECT count(*) FROM public.\"$t\";")
    if [ "$actual" != "$expected" ]; then
      printf '  MISMATCH %-30s source=%s target=%s\n' "$t" "$expected" "$actual"
      bad=1
    fi
  done < "$WORK/before.txt"
  [ "$bad" = 0 ] && echo "  every copied table matches the source exactly."
  exit "$bad"
fi

# ---------------------------------------------------------------------------
say "Guarding against a partial previous run"
# ---------------------------------------------------------------------------
FK_COUNT=$(psql_tgt -Atc "SELECT count(*) FROM pg_constraint
                           WHERE contype='f' AND connamespace='public'::regnamespace;")
HAS_STATE=$(psql_tgt -Atc "SELECT to_regclass('public.$STATE_TABLE') IS NOT NULL;")
ROWS=$(psql_tgt -Atc "SELECT count(*) FROM public.profiles;" 2>/dev/null || echo 0)

echo "foreign keys present : $FK_COUNT"
echo "recovery table exists: $HAS_STATE"
echo "profiles rows        : $ROWS"

# The dangerous state: FKs already dropped and data already present. That is a
# run that died mid-flight. Restoring again would DOUBLE every table, and
# regenerating the FK list now would capture nothing, so the FKs would never
# come back. Refuse and make a human look.
if [ "$FK_COUNT" = "0" ] && [ "$HAS_STATE" = "t" ]; then
  echo
  echo "FATAL: a previous run stopped between dropping the foreign keys and" >&2
  echo "restoring them. The database currently has NO referential integrity." >&2
  echo "Recover the definitions with:" >&2
  echo "    SELECT ddl FROM public.$STATE_TABLE;" >&2
  echo "apply them, verify the row counts, then drop that table before retrying." >&2
  exit 1
fi

if [ "$ROWS" != "0" ]; then
  echo
  echo "FATAL: the target already contains $ROWS profiles. This script only ever" >&2
  echo "loads an empty database — running it twice duplicates every row, and" >&2
  echo "nothing here de-duplicates. If this is a rehearsal, drop and recreate" >&2
  echo "the database, re-run the db-migrate Job, and start again." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
say "Recording and dropping foreign keys"
# ---------------------------------------------------------------------------
psql_tgt -q <<SQL
CREATE TABLE IF NOT EXISTS public.$STATE_TABLE (
  conname text PRIMARY KEY,
  ddl     text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);
TRUNCATE public.$STATE_TABLE;
INSERT INTO public.$STATE_TABLE (conname, ddl)
SELECT conname,
       'ALTER TABLE '||conrelid::regclass||' ADD CONSTRAINT '||quote_ident(conname)||' '||
       pg_get_constraintdef(oid)||';'
  FROM pg_constraint
 WHERE contype='f' AND connamespace='public'::regnamespace;
SQL

SAVED=$(psql_tgt -Atc "SELECT count(*) FROM public.$STATE_TABLE;")
echo "recorded $SAVED foreign keys"
if [ "$SAVED" = "0" ]; then
  echo "FATAL: no foreign keys found to record. The schema is not what this" >&2
  echo "expects — has the db-migrate Job run against this database?" >&2
  exit 1
fi

# Also to the log, so the definitions survive even if this pod and its table are
# both lost. `kubectl logs` outlives the pod; /tmp does not.
echo "--- foreign key definitions (recoverable from this log) ---"
psql_tgt -Atc "SELECT ddl FROM public.$STATE_TABLE ORDER BY conname;"
echo "--- end ---"

psql_tgt -Atc "SELECT 'ALTER TABLE '||conrelid::regclass||' DROP CONSTRAINT '||quote_ident(conname)||';'
                 FROM pg_constraint
                WHERE contype='f' AND connamespace='public'::regnamespace;" \
  | psql_tgt -q -f -
echo "dropped; remaining: $(psql_tgt -Atc "SELECT count(*) FROM pg_constraint WHERE contype='f' AND connamespace='public'::regnamespace;")"

# ---------------------------------------------------------------------------
say "Clearing seeded rows that would collide"
# ---------------------------------------------------------------------------
# 0001_seed_integration_providers inserted the 27 providers. The dump carries
# the same 27 with the same primary keys, so without this the restore fails on
# every one of them. No CASCADE needed — the foreign keys are gone.
if grep -qx "integration_providers" "$WORK/copy.txt"; then
  psql_tgt -q -c "TRUNCATE public.integration_providers;"
  echo "truncated integration_providers (re-seeded from the dump)"
fi

# ---------------------------------------------------------------------------
say "Dump and restore"
# ---------------------------------------------------------------------------
DUMP_ARGS=()
while read -r t; do
  [ -z "$t" ] && continue
  DUMP_ARGS+=(-t "public.\"$t\"")
done < "$WORK/copy.txt"

# Custom format so the restore can run in parallel. --no-owner/--no-acl because
# the Supabase roles do not exist here and are not wanted.
pg_dump "$SOURCE_URL" \
  --data-only --schema=public \
  --no-owner --no-acl --no-privileges \
  -Fc -f "$WORK/data.dump" \
  "${DUMP_ARGS[@]}"
echo "dumped $(du -h "$WORK/data.dump" | cut -f1)"

# --exit-on-error, deliberately. pg_restore's default is to log an error and
# carry on, which produces a "successful" restore with silently missing rows.
# The FKs are already gone, so ordering cannot be the cause of a failure here —
# anything that does fail is real and worth stopping for.
pg_restore -d "$TARGET_URL" \
  --data-only --no-owner --no-acl --no-privileges \
  --exit-on-error --jobs=4 \
  "$WORK/data.dump"
echo "restored"

# ---------------------------------------------------------------------------
say "Restoring foreign keys"
# ---------------------------------------------------------------------------
# ANY FAILURE HERE IS THE REFERENTIAL-INTEGRITY REPORT. A constraint that will
# not re-apply means the source contains rows pointing at something that does
# not exist — orphans that Supabase tolerated because the constraint was added
# later, or was never enforced. Do not work around it by leaving the FK off.
psql_tgt -Atc "SELECT ddl FROM public.$STATE_TABLE ORDER BY conname;" | psql_tgt -q -f -

RESTORED=$(psql_tgt -Atc "SELECT count(*) FROM pg_constraint
                           WHERE contype='f' AND connamespace='public'::regnamespace;")
echo "foreign keys restored: $RESTORED of $SAVED"
if [ "$RESTORED" != "$SAVED" ]; then
  echo "FATAL: not every foreign key came back." >&2
  exit 1
fi

psql_tgt -q -c "DROP TABLE public.$STATE_TABLE;"

# ---------------------------------------------------------------------------
say "ANALYZE"
# ---------------------------------------------------------------------------
# Azure has no statistics for these rows until asked, and the planner will pick
# sequential scans across every join until it has them.
psql_tgt -q -c "ANALYZE;"
echo "done"

# ---------------------------------------------------------------------------
say "Verifying row counts"
# ---------------------------------------------------------------------------
bad=0
while IFS=$'\t' read -r t expected; do
  actual=$(psql_tgt -Atc "SELECT count(*) FROM public.\"$t\";")
  if [ "$actual" != "$expected" ]; then
    printf '  MISMATCH %-30s source=%s target=%s\n' "$t" "$expected" "$actual"
    bad=1
  fi
done < "$WORK/before.txt"

if [ "$bad" != 0 ]; then
  echo >&2
  echo "FATAL: row counts differ. The migration is NOT complete." >&2
  exit 1
fi

echo "  every copied table matches the source exactly."
say "Migration complete"
echo "Supabase is untouched and remains the rollback. Keep it for 30 days."
