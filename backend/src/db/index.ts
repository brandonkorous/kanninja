import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env.js';
import * as schema from './schema/index.js';

/**
 * The application's only database client.
 *
 * Points at Azure Database for PostgreSQL Flexible Server. Two settings are
 * load-bearing there and were implicit under Supabase:
 *
 * **TLS.** Flexible Server has `require_secure_transport = ON` by default.
 * postgres.js does not enable TLS unless asked, so without `ssl` every
 * connection is refused. Azure terminates with a public-CA certificate, so
 * verification stays on — `ssl: 'require'` verifies the chain, unlike
 * `rejectUnauthorized: false`, which would accept anything.
 *
 * **Pool size.** postgres.js defaults to 10 per process. Stated explicitly so
 * that raising `replicas` is a deliberate decision about total connections
 * (replicas × DB_POOL_MAX, plus the reconcile-seats CronJob and any
 * db:migrate run) rather than something discovered when the server starts
 * refusing connections.
 *
 * If you ever route through Azure's built-in PgBouncer (port 6432, transaction
 * pooling) you MUST also set `prepare: false` — postgres.js uses named
 * prepared statements by default and transaction pooling breaks them in ways
 * that surface as intermittent, confusing errors.
 */

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(env.DATABASE_URL);

const client = postgres(env.DATABASE_URL, {
  max: env.DB_POOL_MAX,
  // Local Postgres in dev usually has no certificate at all.
  ssl: isLocal ? false : 'require',
  // Cross-cloud (GKE in GCP → Postgres in Azure) means every connection
  // crosses the public internet, where idle connections get reaped by
  // intermediaries. Recycle before something else does it for us.
  idle_timeout: 60,
  max_lifetime: 60 * 30,
  connect_timeout: 15,
});

export const db = drizzle(client, { schema });
