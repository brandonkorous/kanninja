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
| Ingress / TLS | Shared Caddy in the `sparx-prod` namespace, reserved IP `20.12.217.0`. Config lives in the separate `wize-infrastructure` repo (`k8s/ingress/Caddyfile`), applied by its own release |
| Authentication | Better Auth, in-process in the backend at `/api/auth/*`. No vendor |
| Realtime | WebSocket on the backend (`/api/v1/realtime`). No vendor |

Domains: `kanninja.com`, `www.kanninja.com`, `api.kanninja.com`, `mcp.kanninja.com`.

The Azure resources above (database server, vault, storage, Azure OpenAI, the CI
identity, DNS) are Terraform in the `wize-infrastructure` repo
(`terraform/envs/azure/kanninja.tf`, `terraform/bootstrap-azure/kanninja.tf`),
applied by that repo's own release. Release it first when a kanNINJA change
needs new infrastructure.

Compute is on Azure because the DATABASE is. The server sits behind a private
endpoint in a delegated subnet, so nothing outside that VNet can reach it — not
a laptop, not a GitHub-hosted runner, not with a firewall rule.

## How to deploy

Push to `main`. [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
typechecks, tests, builds three images, pushes them to **GHCR**, reads the
secrets out of Key Vault, applies the manifests, runs the migration Jobs, and
waits on the rollouts.

Images are `ghcr.io/wizeworksllc/kanninja-{backend,frontend,mcp-remote}` —
**hyphenated, and public**, so pods pull them anonymously with no
`imagePullSecrets`. A slash (`kanninja/backend`) names a different package that
does not exist.

CI authenticates to Azure by **federated identity**, not a stored credential:
app registration `gha-kanninja-prod`, subject `repo:wizeworksllc@350084568/kanninja@1208384367` in
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

### WizeLens ingest keys

The backend, frontend and MCP remote send traces to WizeLens Cloud
(`app.wizelens.com`, project `kanninja`), send-only: with `NODE_ENV=production`
the add-on serves no dashboard or read API. The switch and the hub are in
[`../k8s/configmap.yaml`](../k8s/configmap.yaml) (`WIZELENS_ENABLED`,
`WIZELENS_HUB`, `WIZELENS_SAMPLE_RATE`).

Each app has its own ingest key (`wl_ik_…`), so one can be revoked without the
others. The vault name is `wizelens-key-<app>`; the workflow writes it into
that app's own Secret as `WIZELENS_KEY_<APP>`, and the Deployment maps it to
`WIZELENS_HUB_TOKEN`:

```bash
az keyvault secret set --vault-name kv-kanninja-prod-cus --name wizelens-key-backend --value <wl_ik_…>
az keyvault secret set --vault-name kv-kanninja-prod-cus --name wizelens-key-frontend --value <wl_ik_…>
az keyvault secret set --vault-name kv-kanninja-prod-cus --name wizelens-key-mcp --value <wl_ik_…>
```

The keys are optional: a missing one leaves the app running, and only its
traces are refused by the cloud. A new key reaches the pods on the next deploy.

The backend's SQL is traced too: every query of the Drizzle client
(`backend/src/db/index.ts`, on postgres.js), inside the request that ran it.
Scripts and the `reconcile-seats` CronJob stay untraced. In development each service has a local dashboard at
`/_wizelens` (backend `:3001`, frontend `:3000`, MCP remote `:3002`).

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
