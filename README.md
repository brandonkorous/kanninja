# kanNINJA

> Turn chaos into kata. An AI-powered Kanban platform for solo founders, freelancers, and small teams who take their craft seriously.

**Status:** early development · **License:** [FSL-1.1-Apache-2.0](./LICENSE) · **Hosted:** [kanninja.app](https://kanninja.com)

---

## What is this?

kanNINJA is a Kanban board SaaS with first-class AI. The hosted product at kanninja.app is the easiest way to use it. This repository is the source code, published under a source-available license (see below).

### Principles

- **Restraint, warmth, mastery.** The interface should feel like a well-made notebook, not a dashboard.
- **One place for the work.** Boards, AI, time tracking, analytics, integrations — no tab sprawl.
- **Small teams first.** Solo founders to ~10-person teams. Not built for the Jira crowd.

## Tech stack

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), Tailwind 4, DaisyUI 5, ECharts |
| Backend  | Fastify 5, TypeScript, Drizzle ORM                      |
| Database | PostgreSQL (Supabase) + Supabase Realtime               |
| Auth     | Clerk                                                   |
| Payments | Stripe                                                  |
| AI       | OpenAI                                                  |
| Monorepo | pnpm workspaces                                         |

## Monorepo layout

```
kanninja/
├── shared/       # @kanninja/shared — Zod schemas, enums, constants
├── backend/      # @kanninja/backend — Fastify API
├── frontend/     # @kanninja/frontend — Next.js app
└── mcp-server/   # @kanninja/mcp — Model Context Protocol server
```

Frontend never queries the database directly. All data flows through the Fastify API. The only direct Supabase usage on the frontend is Realtime (broadcast + presence).

## Quick start

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm build:shared          # shared must build before backend/frontend
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# fill in Clerk, Supabase, Stripe, OpenAI keys
pnpm dev                   # frontend :3000, backend :3001
```

Database migrations:

```bash
pnpm --filter @kanninja/backend run db:generate
pnpm --filter @kanninja/backend run db:migrate
```

## Deployment

The production target is [Fly.io](https://fly.io). Two apps, one repo:

```bash
# from repo root
fly launch --config fly.backend.toml --copy-config --no-deploy
fly launch --config fly.frontend.toml --copy-config --no-deploy

fly deploy --config fly.backend.toml
fly deploy --config fly.frontend.toml
```

See [`docs/deployment.md`](./docs/deployment.md) for secret setup, region selection, and the full runbook.

## License

kanNINJA is released under the **Functional Source License v1.1 with an Apache 2.0 future grant** (FSL-1.1-Apache-2.0).

**In plain English:**

- You can read, fork, modify, and self-host for internal use, education, or research. That includes running your own instance for your own team.
- You **cannot** offer kanNINJA — or a substantially similar service — as a commercial product that competes with the hosted kanninja.app.
- After two years, each released version automatically relicenses to **Apache 2.0**. The FSL restrictions only apply to recent versions.

If you want to build something commercial that touches this code, [open an issue](https://github.com/brandonkorous/kanninja/issues) or email the maintainer — we're happy to talk.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Security issues: see [SECURITY.md](./SECURITY.md).

## Credits

Built by [Brandon Korous](https://github.com/brandonkorous) at [WizeWorks](https://wizeworks.com).
