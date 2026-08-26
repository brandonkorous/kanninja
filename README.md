# kanNINJA

> Turn chaos into kata. A Kanban platform for solo founders, freelancers, and small teams who take their craft seriously — and for the agents they already work with.

**Status:** early development · **License:** [FSL-1.1-Apache-2.0](./LICENSE) · **Hosted:** [kanninja.com](https://kanninja.com)

---

## What is this?

kanNINJA is a Kanban board SaaS built to be driven by your own agent over MCP. It ships no AI of its own — 42 MCP tools instead, so Claude, ChatGPT, or Cursor can run the board with your context and your model. The hosted product at kanninja.app is the easiest way to use it. This repository is the source code, published under a source-available license (see below).

### Principles

- **Restraint, warmth, mastery.** The interface should feel like a well-made notebook, not a dashboard.
- **One place for the work.** Boards, time tracking, analytics, integrations, and an open door for your agent — no tab sprawl.
- **Small teams first.** Solo founders to ~10-person teams. Not built for the Jira crowd.

## Tech stack

| Layer    | Tech                                                    |
| -------- | ------------------------------------------------------- |
| Frontend | Next.js 15 (App Router), Tailwind 4, DaisyUI 5, ECharts |
| Backend  | Fastify 5, TypeScript, Drizzle ORM                      |
| Database | PostgreSQL (Supabase) + Supabase Realtime               |
| Auth     | Clerk                                                   |
| Payments | Stripe                                                  |
| AI       | None — bring your own agent over MCP                    |
| Monorepo | pnpm workspaces                                         |

## Monorepo layout

```
kanninja/
├── shared/       # @kanninja/shared — Zod schemas, enums, constants
├── backend/      # @kanninja/backend — Fastify API
├── frontend/     # @kanninja/frontend — Next.js app
└── mcp-server/   # kanninja-mcp — Model Context Protocol server
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

Production runs on **Google Kubernetes Engine** — the shared `sparx-prod-autopilot`
Autopilot cluster (GCP project `sparxworks`, `us-central1`), in the `kanninja`
namespace. The database and file storage are on **Microsoft Azure** (Central US).

Deploys are automatic: pushing to `main` runs
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which typechecks
and tests, builds the backend / frontend / mcp-remote images into Artifact
Registry, and rolls them out via Connect Gateway. Cluster Secrets are regenerated
from GitHub Actions secrets on every deploy, so GitHub is the source of truth.

- [`k8s/README.md`](./k8s/README.md) — manifests and the namespace layout
- [`infra/gcp/README.md`](./infra/gcp/README.md) — cluster bootstrap, WIF, DNS
- [`docs/migration-runbook.md`](./docs/migration-runbook.md) — the Clerk → Better Auth
  and Supabase → Azure migration

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
