import postgres from 'postgres';
import 'dotenv/config';

// One-off dev utility: drops and recreates the `public` schema. Use this when
// you need to reapply a fresh Drizzle migration after changing the schema
// files.
//
// Note this now drops the Better Auth tables (auth_users, auth_sessions,
// auth_accounts, auth_verifications) along with everything else — they live in
// `public` like the rest of the schema.
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

  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);
  const sql = postgres(connectionString, { max: 1, ssl: isLocal ? false : 'require' });

  console.log('Dropping public schema…');
  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE');

  console.log('Recreating public schema…');
  await sql.unsafe('CREATE SCHEMA public');

  // Hand the schema back to the connecting role. On Azure Flexible Server that
  // is the admin user from DATABASE_URL, not Supabase's `postgres`/`anon`
  // roles, so the grants are derived rather than hardcoded.
  const [{ current_user: role }] = await sql<{ current_user: string }[]>`SELECT current_user`;
  await sql.unsafe(`GRANT ALL ON SCHEMA public TO "${role}"`);
  await sql.unsafe('GRANT USAGE ON SCHEMA public TO public');

  await sql.end();
  console.log('Public schema reset. Run db:migrate next.');
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
