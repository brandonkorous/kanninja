# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

kanNINJA v2 is a ground-up rebuild of an AI-powered Kanban board SaaS. The v1 source in `../v1/` serves as a feature map (not code reference — it's spaghetti). v2 has proper architecture: API layer, separated concerns, type-safe end-to-end.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | Next.js (App Router) | 15.5 |
| UI | Tailwind CSS + DaisyUI 5 + FontAwesome 6 | TW 4.2, DUI 5.5 |
| Charts | Apache ECharts | 5.6 |
| Backend | Fastify + TypeScript | 5.8 |
| DB Layer | Drizzle ORM → Supabase PostgreSQL | 0.39 |
| Auth | Clerk (custom UI) | 6.39 |
| Payments | Stripe | 17.7 |
| Real-time | Supabase Realtime Broadcast + Presence | |
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
- `src/config/` — Env (Zod-validated), Supabase client, Stripe client
- `src/plugins/` — Fastify plugins (auth, CORS, error-handler, rate-limit)
- `src/middleware/` — preHandlers (require-auth, require-board-role, require-clan-role, require-subscription)
- `src/routes/` — REST endpoints grouped by resource
- `src/services/` — Business logic layer (routes call these)
- `src/repositories/` — Data access layer (Drizzle queries)
- `src/db/schema/` — Drizzle table definitions
- `src/db/index.ts` — Drizzle client instance

### frontend/ (`@kanninja/frontend`)
- `src/app/` — Next.js App Router pages
  - `(marketing)/` — Public pages (features, pricing, about)
  - `(auth)/` — Sign-in, sign-up
  - `(app)/` — Authenticated app (dashboard, board view, clans, settings)
- `src/components/` — Feature-grouped components
- `src/hooks/` — React Query hooks with `use-api.ts` for Clerk token injection
- `src/lib/api-client.ts` — Typed fetch wrapper (all data flows through Fastify API)
- `src/lib/supabase-client.ts` — Supabase client (Realtime + Presence ONLY)
- `src/providers/` — ClerkProvider, QueryProvider, ThemeProvider
- `src/middleware.ts` — Clerk auth middleware (public vs protected routes)

## Architecture

```
Frontend (Next.js)
  → API Client (fetch + Clerk JWT)
    → Fastify Routes (Zod input validation)
      → Middleware (auth, role checks, subscription gates)
        → Services (business logic)
          → Repositories (Drizzle ORM)
            → Supabase PostgreSQL
```

**Key rule:** Frontend NEVER queries Supabase directly for data. All CRUD goes through Fastify. The only frontend Supabase usage is Realtime (broadcast channels + presence).

## Auth Flow

1. User signs in via custom Clerk UI in Next.js
2. `use-api.ts` hook attaches Clerk session JWT to all API requests
3. Fastify `require-auth` middleware verifies JWT, resolves `clerk_user_id` → `profiles.id`
4. Clerk webhooks sync user data to `profiles` table via `POST /api/webhooks/clerk`

## Database

Drizzle ORM with PostgreSQL (Supabase). Schema defined in `backend/src/db/schema/`. No RLS — authorization enforced in Fastify middleware.

Core tables: profiles, boards, lists, cards, board_members, board_invitations, clans, clan_members, subscriptions, card_comments, card_checklist_items, card_attachments, custom_labels, card_labels, custom_field_definitions, custom_field_values, time_entries, board_activities, audit_logs, notification_queue, ai_interactions, analytics_snapshots, project_expenses.

## Key Conventions

- Shared Zod schemas are the single source of truth for types (no manual type duplication)
- Backend uses 3-layer pattern: routes → services → repositories
- Frontend hooks use React Query with the `useApi()` hook for auth token injection
- DaisyUI 5 component classes for UI (not shadcn/ui)
- FontAwesome icons (not lucide-react)
- Apache ECharts for charts (not recharts)
- Fractional indexing (TEXT) for list/card ordering (no integer reindexing)

## V1 Feature Reference

When checking what needs to be built, reference:
- Feature inventory: `../v1/src/pages/` (31 pages), `../v1/src/components/` (feature-grouped)
- DB schema: `../v1/src/integrations/supabase/types.ts`
- Subscription config: `../v1/kanninja.json`
