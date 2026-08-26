// Frontend-local ESLint config.
//
// The workspace config at ../eslint.config.js has no Next.js plugins, so with
// only that one in scope every `eslint-disable-next-line @next/next/...` and
// `react-hooks/...` comment in this package resolved to a rule that does not
// exist — which ESLint reports as an error. `pnpm lint` therefore failed on a
// clean checkout, and the disable-comments were the only thing it complained
// about. Real Next.js and react-hooks findings were never being checked at all.
//
// ESLint flat config resolves the NEAREST eslint.config.* walking up from the
// file being linted, so this file replaces the workspace one for the frontend
// rather than merging with it. That means the workspace's TypeScript rules are
// restated at the bottom.

import next from 'eslint-config-next/core-web-vitals';

const config = [
    { ignores: ['.next/**', 'dist/**', 'node_modules/**', 'next-env.d.ts'] },
    ...next,
    {
        rules: {
            // Scoped, not disabled. This rule guards two genuinely dangerous
            // characters — a bare `>` or `}` in JSX text can change what the
            // element parses as. It ALSO flags straight quotes and apostrophes
            // in prose, which is where all 83 of our hits were: 47 apostrophes
            // and 36 double quotes, mostly in the legal pages. Those render
            // correctly and escaping them would mean rewriting contract text to
            // satisfy a typographic preference. Keep the teeth, drop the fuss.
            'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],

            // New in eslint-plugin-react-hooks 7, and it fires on the ordinary
            // "read localStorage / sync a prop into state on mount" pattern —
            // 21 hits across 19 files, one or two each. Every one is a real
            // thing worth revisiting, and none is a bug today. Left as warnings
            // so they stay VISIBLE and get fixed as those files are touched,
            // rather than turned off and forgotten. Do not add more.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn',
        },
    },
    {
        // `files` must match next/typescript's own scope. That entry registers
        // the @typescript-eslint plugin for **/*.{ts,tsx} only, and flat config
        // resolves a rule's plugin from the objects matching the SAME file — so
        // an unscoped object here fails with "could not find plugin", and
        // re-declaring the plugin fails with "cannot redefine plugin".
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            // Matches the workspace config, which no longer applies here.
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
        },
    },
];

export default config;
