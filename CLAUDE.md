# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

kanNINJA v2 is a ground-up rebuild of a Kanban board SaaS designed to be driven by the user's own agent over MCP. It runs **no first-party AI** — built-in AI was removed deliberately; the only model call left is Whisper transcription for voice capture (Azure OpenAI). The v1 source in `../v1/` serves as a feature map (not code reference — it's spaghetti). v2 has proper architecture: API layer, separated concerns, type-safe end-to-end.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.5 |
| UI | Tailwind CSS + DaisyUI 5 + FontAwesome 6 | TW 4.2, DUI 5.5 |
| Charts | Apache ECharts | 5.6 |
| Backend | Fastify + TypeScript | 5.8 |
| DB Layer | Drizzle ORM → Azure Database for PostgreSQL | 0.45 |
| Auth | Better Auth (self-hosted, custom UI) | 1.6 |
| Payments | Stripe | 17.7 |
| Storage | Azure Blob Storage (card attachments) | |
| Email | Resend (verification codes, password resets) | |
| Real-time | WebSocket (@fastify/websocket) broadcast + presence | |
| Monorepo | pnpm workspaces | |
| Validation | Zod (shared between FE/BE) | 3.25 |

## Commands

All commands run from `v2/` root:

```bash
pnpm install                    # Install all workspace dependencies
pnpm build:shared               # Build shared package (must run before other builds)
pnpm dev                        # Start all packages in dev mode (parallel)
pnpm dev:backend                # Backend only (Fastify on :3001)
pnpm dev:frontend               # Frontend only (Next.js on :3000)
pnpm typecheck                  # Typecheck all workspaces
pnpm lint                       # Lint all workspaces

# Backend-specific
pnpm --filter @kanninja/backend run db:generate   # Generate Drizzle migrations
pnpm --filter @kanninja/backend run db:migrate    # Run migrations
pnpm --filter @kanninja/backend run db:studio     # Drizzle Studio
```

## Monorepo Structure

```
v2/
├── shared/         # @kanninja/shared — Zod schemas, types, enums, constants
├── backend/        # @kanninja/backend — Fastify API server
└── frontend/       # @kanninja/frontend — Next.js app
```

### shared/ (`@kanninja/shared`)
- `src/schemas/` — Zod schemas (source of truth for all data shapes)
- `src/enums.ts` — BoardRole, ClanRole, Priority, SubscriptionTier, etc.
- `src/constants.ts` — Subscription tier config (prices, features, limits)
- `src/errors.ts` — API error codes, response types

### backend/ (`@kanninja/backend`)
- `src/index.ts` — Fastify server bootstrap
- `src/config/` — Env (Zod-validated), Azure Blob client, Stripe client
- `src/plugins/` — Fastify plugins (auth, CORS, error-handler, rate-limit)
- `src/middleware/` — preHandlers (require-auth, require-board-role, require-clan-role, require-subscription)
- `src/routes/` — REST endpoints grouped by resource
- `src/services/` — Business logic layer (routes call these)
- `src/repositories/` — Data access layer (Drizzle queries)
- `src/db/schema/` — Drizzle table definitions
- `src/db/index.ts` — Drizzle client instance (TLS + explicit pool size)
- `src/lib/auth.ts` — Better Auth server config (the auth server itself)

### frontend/ (`@kanninja/frontend`)
- `src/app/` — Next.js App Router pages
  - `(marketing)/` — Public pages (features, pricing, about)
  - `(auth)/` — Sign-in, sign-up
  - `(app)/` — Authenticated app (dashboard, board view, clans, settings)
- `src/components/` — Feature-grouped components
- `src/hooks/` — React Query hooks; `use-api.ts` wraps the API client
- `src/lib/api-client.ts` — Typed fetch wrapper (all data flows through Fastify API)
- `src/lib/auth-client.ts` — Better Auth browser client
- `src/lib/auth-server.ts` — server-side session read (App Router)
- `src/providers/` — QueryProvider, ThemeProvider (auth needs no provider)
- `src/middleware.ts` — optimistic session-cookie check (public vs protected)

## Architecture

```
Frontend (Next.js)
  → API Client (fetch + session cookie, credentials: 'include')
    → Fastify Routes (Zod input validation)
      → Middleware (auth, role checks, subscription gates)
        → Services (business logic)
          → Repositories (Drizzle ORM)
            → Azure PostgreSQL
```

**Key rule:** The frontend NEVER talks to the database. All CRUD goes through Fastify — including realtime, which is a WebSocket to that same API.

## Auth Flow

Better Auth runs **inside the Fastify backend** at `/api/auth/*` — there is no auth vendor.

1. User signs in via the custom UI calling `authClient` (`frontend/src/lib/auth-client.ts`)
2. The API sets a session cookie scoped to `.kanninja.com`, so kanninja.com can send it to api.kanninja.com
3. `api-client.ts` sends `credentials: 'include'` on every request — there is no token to inject
4. Fastify `require-auth` resolves the session, then `profiles.user_id` → `profiles.id`
5. Sign-up provisioning (profile + personal clan + admin membership) runs in Better Auth's `databaseHooks.user.create.after` — see `services/profile-provisioning.service.ts`

`require-auth` accepts four credential shapes, in this order: `ninja_live_*` API keys, MCP OAuth JWTs, the session cookie, and — until T+7d after cutover — legacy Clerk tokens.

## Database

Drizzle ORM with PostgreSQL (Azure Flexible Server). Schema in `backend/src/db/schema/`. No RLS — authorization is enforced in Fastify middleware.

**40 tables.** Identity: `auth_users` / `auth_sessions` / `auth_accounts` / `auth_verifications` (Better Auth's own) plus `profiles` — the application identity that every other table FKs to. Boards: boards, lists, cards, board_clans. Card features: card_comments, card_checklist_items, card_attachments, custom_labels, card_labels, custom_field_definitions, custom_field_values, time_entries. Clans: clans, clan_members, clan_invitations, clan_settings, clan_role_permissions. Billing: subscriptions, stripe_webhook_events. Activity: board_activities, audit_logs. Notifications: notification_queue, notification_preferences. Analytics: analytics_snapshots, project_expenses (plus ai_interactions, orphaned since built-in AI was removed — retained for history, pending a drop migration). API: api_keys. Integrations: integration_providers, integration_connections, integration_events, integration_sync_state. MCP OAuth: oauth_clients, oauth_authorization_codes, oauth_refresh_tokens, oauth_authorization_requests.

There is no `board_members` table — board access is granted through `board_clans`.

Migrations were re-baselined; `backend/drizzle-legacy/` holds the pre-baseline history and is never executed. See [docs/migration-runbook.md](docs/migration-runbook.md).

## Key Conventions

- Shared Zod schemas are the single source of truth for types (no manual type duplication)
- Backend uses 3-layer pattern: routes → services → repositories
- Frontend hooks use React Query with the `useApi()` hook; auth rides the session cookie
- DaisyUI 5 component classes for UI (not shadcn/ui)
- FontAwesome icons (not lucide-react)
- Apache ECharts for charts (not recharts)
- Fractional indexing (TEXT) for list/card ordering (no integer reindexing)

## V1 Feature Reference

When checking what needs to be built, reference:
- Feature inventory: `../v1/src/pages/` (31 pages), `../v1/src/components/` (feature-grouped)
- DB schema: `../v1/src/integrations/supabase/types.ts`
- Subscription config: `../v1/kanninja.json`
