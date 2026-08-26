import { defineConfig } from 'tsup';

export default defineConfig({
    // EVERY entry here exists because something has to run it INSIDE THE
    // CLUSTER. Azure Postgres has `public_network_access_enabled = false` and
    // sits in a delegated subnet, so nothing outside the VNet can reach it —
    // not a laptop, not a GitHub-hosted runner, not with a firewall rule. The
    // only way to run a migration or a backfill is a pod, and a pod runs the
    // runtime image, which is installed `--prod`.
    //
    // `--prod` IS THE WHOLE CONSTRAINT. Every one of these has a `tsx ...`
    // script in package.json, and tsx is a devDependency: it is absent from the
    // runtime image and always will be. Compiling them here is what makes them
    // runnable as `node dist/...` with no dev toolchain in production.
    //
    // Adding a script that must run against production means adding it here.
    // Forgetting to is not a build error — it is a Job that fails at 2am with
    // `Cannot find module`.
    entry: [
        'src/index.ts',
        'src/scripts/reconcile-seats.ts',
        // Schema migrations. Reads ./drizzle relative to the working directory,
        // which is why the Dockerfile copies that folder into /app.
        'src/db/migrate.ts',
        // The Clerk -> Better Auth data migration (docs/migration-runbook.md
        // Track D Phase 2). One-shot, but it runs against the private database
        // exactly like the migrator does.
        'src/scripts/migrate-clerk-users.ts',
        'src/scripts/backfill-profile-user-id.ts',
        'src/scripts/seed-auth-users-from-profiles.ts',
        // Operational one-off, occasionally needed against production.
        'src/scripts/create-api-key.ts',
    ],
    format: ['esm'],
    outDir: 'dist',
    target: 'node22',
    bundle: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: false,
    // Keep node_modules external (do not bundle deps)
    noExternal: [],
});
