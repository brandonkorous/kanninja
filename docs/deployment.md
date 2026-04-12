# Deployment (Fly.io)

kanNINJA runs as two Fly apps: `kanninja-backend` (Fastify) and `kanninja-frontend` (Next.js). Both build from this monorepo using Dockerfiles at the v2 root so pnpm workspace dependencies resolve correctly.

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed and logged in (`fly auth login`)
- Supabase project (for Postgres + Realtime)
- Clerk app (publishable + secret keys, webhook secret)
- Stripe account (secret key + webhook secret)
- OpenAI API key

## First-time setup

Run from the repo root.

### 1. Launch the apps

```bash
fly launch --config fly.backend.toml  --copy-config --no-deploy --name kanninja-backend
fly launch --config fly.frontend.toml --copy-config --no-deploy --name kanninja-frontend
```

Pick the same `primary_region` for both (e.g. `iad`, `sjc`, `lhr`) — ideally close to your Supabase region.

### 2. Set backend secrets

```bash
fly secrets set --app kanninja-backend \
  DATABASE_URL="postgresql://..." \
  SUPABASE_URL="https://xxx.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="..." \
  CLERK_SECRET_KEY="sk_live_..." \
  CLERK_PUBLISHABLE_KEY="pk_live_..." \
  CLERK_WEBHOOK_SECRET="whsec_..." \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  OPENAI_API_KEY="sk-..." \
  INTEGRATION_ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

Add integration provider secrets (Google, Slack, GitHub, etc.) as you enable each one — see `backend/.env.example` for the full list.

### 3. Set frontend secrets

Frontend `NEXT_PUBLIC_*` vars are baked in at build time, so they're passed as `--build-arg` on each deploy. Server-only secrets go in `fly secrets`.

```bash
fly secrets set --app kanninja-frontend \
  CLERK_SECRET_KEY="sk_live_..."
```

### 4. Point the backend at the frontend

Update `fly.backend.toml` `FRONTEND_URL` to the deployed frontend origin (e.g. `https://kanninja-frontend.fly.dev` or your custom domain), then redeploy the backend so CORS allows it.

## Deploy

```bash
# backend first — frontend depends on its API URL
fly deploy --config fly.backend.toml

# frontend — pass build-time public vars
fly deploy --config fly.frontend.toml \
  --build-arg NEXT_PUBLIC_API_URL="https://kanninja-backend.fly.dev" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..." \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

## Custom domains

```bash
fly certs add kanninja.app        --app kanninja-frontend
fly certs add api.kanninja.com    --app kanninja-backend
```

Add the DNS records Fly prints. Once the cert is issued, update `FRONTEND_URL` on the backend and redeploy.

## Webhooks

Point the following webhooks at your deployed backend:

| Service | URL                                            |
| ------- | ---------------------------------------------- |
| Clerk   | `https://api.kanninja.com/api/webhooks/clerk`  |
| Stripe  | `https://api.kanninja.com/api/webhooks/stripe` |

Integration provider webhooks (GitHub, Slack, etc.) use `/api/integrations/webhooks/:provider`.

## Database migrations

Migrations are not run automatically on deploy. Run them from your local machine or a one-off machine:

```bash
# with DATABASE_URL pointed at production
pnpm --filter @kanninja/backend run db:migrate
```

For automation, add a pre-deploy step or run in a release command.

## Scaling

```bash
fly scale count 2 --app kanninja-backend      # horizontal
fly scale vm shared-cpu-2x --app kanninja-backend  # vertical
```

Both apps use `auto_stop_machines = "stop"` so they scale to zero when idle and wake on request.

## Logs and troubleshooting

```bash
fly logs --app kanninja-backend
fly ssh console --app kanninja-backend
fly status --app kanninja-backend
```
