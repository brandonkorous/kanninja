# Deployment

> The previous version of this file documented a **Fly.io** deployment against
> Supabase and Clerk. All three are gone: the app moved to AKS, then to GKE
> (2026-06-06), and the Clerk → Better Auth / Supabase → Azure migration
> retired the rest. It was kept around long enough to be actively misleading,
> so it has been replaced with pointers to what is actually true.

## Where things run

| Component | Where |
|---|---|
| Frontend, backend, MCP remote | GKE — shared `sparx-prod-autopilot` Autopilot cluster, GCP project `sparxworks`, `us-central1`, namespace `kanninja` |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server, Central US |
| Card attachments | Azure Blob Storage, Central US |
| Ingress / TLS | Shared Caddy reverse proxy in the `sparx-prod` namespace — config lives in the separate `sparx.works` repo |
| Authentication | Better Auth, in-process in the backend at `/api/auth/*`. No vendor. |
| Realtime | WebSocket on the backend (`/api/v1/realtime`). No vendor. |

Domains: `kanninja.com`, `api.kanninja.com`, `mcp.kanninja.com`.

## How to deploy

Push to `main`. [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
typechecks and tests, builds three images into Artifact Registry, regenerates the
cluster Secrets from GitHub Actions secrets, and rolls out.

There is no manual deploy path, and no separate secret-setup step: because the
Secrets are regenerated on every deploy, **a value patched only with `kubectl`
is reverted by the next push.** Change the GitHub Actions secret first.

## Migrations

Not run by CI. From a machine that can reach the database:

```bash
DATABASE_URL=... pnpm --filter @kanninja/backend run db:migrate
```

`drizzle/` is not copied into the runtime image, so this cannot currently run as
an in-cluster Job without a `Dockerfile.backend` change.

## Further reading

- [`migration-runbook.md`](./migration-runbook.md) — the Clerk → Better Auth and
  Supabase → Azure migration, including the drizzle re-baseline
- [`../k8s/README.md`](../k8s/README.md) — manifests, ConfigMaps, Secrets
- [`../infra/gcp/README.md`](../infra/gcp/README.md) — cluster bootstrap, Workload
  Identity Federation, DNS cutover
- [`mcp-phase-2b-hosted-remote.md`](./mcp-phase-2b-hosted-remote.md) — the MCP
  OAuth design (still accurate; ignore its AKS references)
