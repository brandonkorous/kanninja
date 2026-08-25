-- Enable RLS on every table in the public schema.
--
-- v2 enforces authorization in Fastify middleware and connects via the postgres
-- role (DATABASE_URL), which bypasses RLS. This migration adds NO policies — it
-- just flips RLS on so any future use of the anon / authenticated roles
-- (Supabase JS, leaked anon key, etc.) is denied by default. It also clears
-- Supabase's "RLS disabled" security advisor warnings.
--
-- A DO loop is used so any new table created in later migrations is covered
-- without needing a follow-up migration. Idempotent: running it again is a
-- no-op for tables that already have RLS enabled.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
      AND c.relname NOT LIKE 'drizzle_%'
      AND c.relname NOT LIKE '\_\_drizzle\_%' ESCAPE '\'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;
