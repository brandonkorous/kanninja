import { defineConfig } from 'tsup';

// kanninja-mcp ships to npm as a standalone CLI + library. @kanninja/shared is
// a private, unpublished workspace package, so it is bundled into the output —
// the published package depends only on real npm packages
// (@modelcontextprotocol/sdk, dotenv, zod). One entry per `exports` subpath.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tools/index': 'src/tools/index.ts',
    registry: 'src/registry.ts',
    'api-client': 'src/api-client.ts',
    context: 'src/context.ts',
  },
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  bundle: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  // `resolve` inlines @kanninja/shared's types into the .d.ts files, so the
  // declarations are self-contained too — not just the JS.
  dts: { resolve: ['@kanninja/shared'] },
  // Dedicated build tsconfig — the package tsconfig.json uses `composite`,
  // which the tsup declaration build cannot consume.
  tsconfig: 'tsconfig.build.json',
  noExternal: ['@kanninja/shared'],
});
