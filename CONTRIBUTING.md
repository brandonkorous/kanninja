# Contributing to kanNINJA

Thanks for your interest. A few notes before you dive in.

## Licensing

This project is licensed under [FSL-1.1-Apache-2.0](./LICENSE). By submitting a contribution, you agree your contribution is licensed under the same terms, and you grant WizeWorks the right to relicense the combined work as needed (including under the Apache 2.0 future grant).

If you're submitting a substantial contribution, we may ask you to sign a simple Contributor License Agreement (CLA) — this protects both sides and keeps the license story clean.

## Before you open a PR

1. **Open an issue first** for anything non-trivial. Spec the change with us before you invest time — we may already be working on it, or have constraints that aren't obvious.
2. **Small PRs ship faster.** One concern per PR. Refactors separate from features.
3. **Run the checks locally:**

   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

## Code conventions

See [CLAUDE.md](./CLAUDE.md) for full architecture and conventions. Highlights:

- Files ≤200 lines.
- Shared Zod schemas are the single source of truth for types.
- Backend: routes → services → repositories. No shortcuts.
- Frontend: all data via the Fastify API. No direct Supabase queries (Realtime excepted).
- UI uses DaisyUI semantic classes, not raw hex. FontAwesome for icons.
- Design language is [Hanko](./.claude/skills/hanko/SKILL.md) — read the skill before touching UI.

## Commit messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(boards): add cover image upload
fix(auth): handle expired Clerk tokens
docs: clarify fly.io deployment steps
```

## Questions

Open a [Discussion](https://github.com/brandonkorous/kanninja/discussions) or an issue. We read everything.
