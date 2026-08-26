import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // DATABASE_URL is the one variable config/env.ts requires with no default,
    // and it calls process.exit(1) when validation fails. Three suites reach it
    // transitively — they import a service, which imports src/db/index.ts,
    // which imports env — so without a value here the whole worker dies with
    // "process.exit unexpectedly called with 1" and the suites are reported as
    // failing to COLLECT rather than failing a test.
    //
    // It passed on every developer machine and failed only in CI, because a
    // working tree has backend/.env and dotenv loads it. A fresh checkout does
    // not. Reproduce with `mv backend/.env /tmp && pnpm test`.
    //
    // NOT A REAL DATABASE, and nothing connects to it: postgres.js opens a
    // connection lazily, on the first query, and these are unit tests that never
    // issue one. This value exists to satisfy a Zod schema at import time.
    // Anything that needs a live database belongs in an integration suite with
    // a real server, not here.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/kanninja_test',
    },
    coverage: {
      include: ['src/services/**', 'src/utils/**', 'src/repositories/**'],
    },
  },
});
