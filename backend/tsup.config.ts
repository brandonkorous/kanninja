import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
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
