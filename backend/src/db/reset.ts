import postgres from 'postgres';
import 'dotenv/config';

// One-off dev utility: drops and recreates the `public` schema, leaving
// Supabase's other schemas (auth, storage, realtime, extensions, etc.)
// untouched. Use this when you need to reapply a fresh Drizzle migration
// after changing the schema files.
//
// SAFETY: this destroys ALL application data. Only run on dev/staging.
// Guarded by the DRIZZLE_RESET_OK env var so you can't accidentally
// type the script name in production.
//
//   DRIZZLE_RESET_OK=yes pnpm tsx src/db/reset.ts
async function main() {
  if (process.env.DRIZZLE_RESET_OK !== 'yes') {
    console.error(
      'Refusing to run without DRIZZLE_RESET_OK=yes. This drops all app data.',
    );
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const sql = postgres(connectionString, { max: 1 });

  console.log('Dropping public schema…');
  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE');

  console.log('Recreating public schema…');
  await sql.unsafe('CREATE SCHEMA public');

  // Restore the default Supabase grants on public so the service role
  // and anon roles can still operate after the reset.
  await sql.unsafe('GRANT ALL ON SCHEMA public TO postgres');
  await sql.unsafe('GRANT ALL ON SCHEMA public TO public');

  await sql.end();
  console.log('Public schema reset. Run db:migrate next.');
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
