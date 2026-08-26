# Deployment

## Where things run

| Component | Where |
|---|---|
| Frontend, backend, MCP remote | **AKS** — `aks-sparx-prod-cus` (resource group `rg-sparx-prod-cus`, Central US), namespace `kanninja`, co-tenant with sparx, jotDOJO and SilicaUI |
| PostgreSQL | Azure Database for PostgreSQL Flexible Server, Central US, `public_network_access_enabled = false` |
| Card attachments | Azure Blob Storage, container `card-attachments`, handed out as short-lived SAS URLs |
| Profile pictures | Azure Blob Storage, container `avatars`, **private** — streamed through `GET /api/v1/avatars/…` |
| Secrets | Azure Key Vault `kv-kanninja-prod-cus` |
| Speech-to-text | Azure OpenAI `oai-kanninja-prod-eus2`, Whisper. The only model call in the product |
| Ingress / TLS | Shared Caddy in the `sparx-prod` namespace, reserved IP `20.12.217.0` — config lives in the separate `sparx.works` repo |
| Authentication | Better Auth, in-process in the backend at `/api/auth/*`. No vendor |
| Realtime | WebSocket on the backend (`/api/v1/realtime`). No vendor |

Domains: `kanninja.com`, `www.kanninja.com`, `api.kanninja.com`, `mcp.kanninja.com`.

Compute is on Azure because the DATABASE is. The server sits behind a private
endpoint in a delegated subnet, so nothing outside that VNet can reach it — not
a laptop, not a GitHub-hosted runner, not with a firewall rule.

## How to deploy

Push to `main`. [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
typechecks, tests, builds three images, pushes them to **GHCR**, reads the
secrets out of Key Vault, applies the manifests, runs the migration Jobs, and
waits on the rollouts.

Images are `ghcr.io/brandonkorous/kanninja-{backend,frontend,mcp-remote}` —
**hyphenated, and public**, so pods pull them anonymously with no
`imagePullSecrets`. A slash (`kanninja/backend`) names a different package that
does not exist.

CI authenticates to Azure by **federated identity**, not a stored credential:
app registration `gha-kanninja-prod`, subject `repo:brandonkorous/kanninja` in
the plain form (jotDOJO's numeric-qualified form does not resolve here).

### Secrets

They live in Key Vault and the workflow writes them into the cluster Secret on
every deploy, so **a value patched only with `kubectl` is reverted by the next
push.** Change the vault entry first.

Vault names use hyphens (`DATABASE-ADMIN-URL`), environment variables use
underscores (`DATABASE_ADMIN_URL`); the workflow translates.

> Reading a secret with `az … -o tsv` appends a newline. Every read in the
> workflow is wrapped in `printf '%s' "$(…)"` for that reason — an unstripped
> one reaches Postgres as `sslmode=require\n` and the connection fails on a
> value that looks correct in every log.

Non-secret configuration is in [`../k8s/configmap.yaml`](../k8s/configmap.yaml)
rather than the workflow, so public constants are readable in the manifests
instead of looking like credentials that need rotating.

## Migrations

Run by CI, as an in-cluster Job, on every deploy — a pod is the only thing that
can reach the database. `drizzle/` is copied into the runtime image, and every
script that must run against production is a `tsup` entry (see the comment at
the top of [`../backend/tsup.config.ts`](../backend/tsup.config.ts): `tsx` is a
devDependency and is not in the `--prod` runtime image).

A second Job reconciles the restricted `kanninja_app` role the app connects as;
the migrator connects as the admin.

To run a one-off script against production, copy the Job shape from the
workflow: the `kanninja-backend` image, `command: ["node", "dist/scripts/<name>.js"]`,
and `envFrom` both `backend-secrets` and `backend-config`.

## Further reading

- [`azure-migration-plan.md`](./azure-migration-plan.md) — the 2026-08-26
  cutover, what was verified afterwards, and what is still outstanding
- [`migration-runbook.md`](./migration-runbook.md) — the Clerk → Better Auth and
  Supabase → Azure data migration, including the drizzle re-baseline
- [`../k8s/README.md`](../k8s/README.md) — manifests, ConfigMaps, Secrets
- [`mcp-phase-2b-hosted-remote.md`](./mcp-phase-2b-hosted-remote.md) — the MCP
  OAuth design
