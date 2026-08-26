import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

// Azure Flexible Server enforces TLS (require_secure_transport = ON); a
// plaintext connection is refused outright. Mirrors src/db/index.ts.
const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(connectionString);

const client = postgres(connectionString, { max: 1, ssl: isLocal ? false : 'require' });
const db = drizzle(client);

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations complete.');
  await client.end();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
