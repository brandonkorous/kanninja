# kanNINJA on AKS

Kubernetes manifests for kanNINJA v2, deployed to the shared
**`aks-sparx-prod-cus`** cluster (resource group `rg-sparx-prod-cus`, Central
US) in the **`kanninja`** namespace, co-tenant with sparx, jotDOJO and
SilicaUI.

> Deploy mechanics, secret handling, and migration Jobs:
> [`../docs/deployment.md`](../docs/deployment.md).

## What's here

| File | Purpose |
|------|---------|
| `namespace.yaml` | `kanninja` namespace |
| `configmap.yaml` | Non-secret env for backend / frontend / mcp |
| `backend-deployment.yaml` + `backend-service.yaml` | Fastify API (`:3001` -> svc `:80`) |
| `frontend-deployment.yaml` + `frontend-service.yaml` | Next.js (`:3000` -> svc `:80`) |
| `mcp-deployment.yaml` + `mcp-service.yaml` | MCP remote (`:3002` -> svc `:80`) |
| `reconcile-seats-cronjob.yaml` | Daily Stripe seat reconciliation |
| `secret.example.yaml` | Shape reference; real Secrets are written by CI |

## How it deploys

`.github/workflows/deploy.yml` on push to `main`:

1. **Auth** — federated identity to Entra (app registration `gha-kanninja-prod`,
   subject `repo:brandonkorous/kanninja`). Keyless; no stored credential.
2. **Build** — backend / frontend / mcp-remote pushed to **GHCR** as
   `ghcr.io/brandonkorous/kanninja-{backend,frontend,mcp-remote}`. Hyphenated,
   and public, so pods pull anonymously — no `imagePullSecrets`.
3. **Secrets** — read from Key Vault `kv-kanninja-prod-cus` and written into
   `backend-secrets` / `frontend-secrets` / `mcp-secrets`. **The vault is the
   source of truth**: a value patched only with `kubectl` is reverted by the
   next push.
4. **Apply** — `kubectl apply -k .` with image tags pinned to the commit SHA.
5. **Migrate** — a `db-migrate` Job and a `db-role` Job run in-cluster. They
   have to: the database has `public_network_access_enabled = false` and sits
   in a delegated subnet, so a pod is the only thing that can reach it.

## Ingress / TLS

There is **no nginx-ingress or cert-manager** on this cluster. Routing and TLS
for `kanninja.com` / `www` / `api.kanninja.com` / `mcp.kanninja.com` are handled
by the shared **Caddy** reverse proxy in the `sparx-prod` namespace (reserved IP
**20.12.217.0**), which reaches these Services cross-namespace. The route blocks
live in `sparx.works/k8s/ingress/Caddyfile`.

kanNINJA's blocks use **on-demand** TLS (`import tls_policy`), and all four
hostnames are allow-listed in api-rest's `PLATFORM_HOSTNAMES`. An explicit
managed block cannot work here: Caddy is `replicas: 1` on `Recreate`, so every
boot has a window with no load-balancer backend, and certmagic spends its
startup issuance attempts inside it.

## Manual apply (rarely needed — CI owns this)

```bash
az aks get-credentials --resource-group rg-sparx-prod-cus --name aks-sparx-prod-cus
kubectl apply -k k8s/        # Secrets must already exist in the namespace
kubectl -n kanninja get deploy,svc,pods
```
