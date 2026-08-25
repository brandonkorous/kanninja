# kanNINJA on GKE

Kubernetes manifests for kanNINJA v2, deployed to the shared
**`sparx-prod-autopilot`** GKE cluster (project `sparxworks`, `us-central1`) in
the **`kanninja`** namespace.

> Full migration + go-live runbook: [`../infra/gcp/README.md`](../infra/gcp/README.md)
> (DNS cutover, Caddy apply, WIF, teardown). GCP bootstrap: `../infra/gcp/bootstrap.sh`.

## What's here

| File | Purpose |
|------|---------|
| `namespace.yaml` | `kanninja` namespace |
| `configmap.yaml` | Non-secret env for backend / frontend / mcp |
| `backend-deployment.yaml` + `backend-service.yaml` | Fastify API (`:3001` → svc `:80`) |
| `frontend-deployment.yaml` + `frontend-service.yaml` | Next.js (`:3000` → svc `:80`) |
| `mcp-deployment.yaml` + `mcp-service.yaml` | MCP remote (`:3002` → svc `:80`) |
| `reconcile-seats-cronjob.yaml` | Daily Stripe seat reconciliation |
| `secret.example.yaml` | Shape reference; real Secrets are bootstrapped by CI |

## How it deploys

`.github/workflows/deploy.yml` on push to `main`:

1. **Auth** — Workload Identity Federation (`kanninja-pool`) → `kanninja-deployer` SA. Keyless.
2. **Build** — backend / frontend / mcp-remote images pushed to Artifact Registry
   (`ghcr.io/brandonkorous/kanninja/*`). Autopilot's node SA pulls
   them natively — no `imagePullSecrets`.
3. **Connect** — `gcloud container fleet memberships get-credentials` (Connect
   Gateway) reaches the private control plane. The public endpoint is firewalled.
4. **Secrets** — `backend-secrets` / `frontend-secrets` / `mcp-secrets` upserted
   from GitHub Actions secrets (GitHub is the source of truth).
5. **Apply** — `kubectl apply -k .` with image tags pinned to the commit SHA.

## Ingress / TLS

There is **no nginx-ingress or cert-manager** on this cluster. HTTP(S) routing
and TLS for `kanninja.com` / `www` / `api.kanninja.com` / `mcp.kanninja.com` are
handled by the shared **Caddy** reverse proxy in the `sparx-prod` namespace
(LB `35.254.145.54`), which reaches these Services cross-namespace. The route
blocks live in `sparx.works/k8s/caddy/Caddyfile`. See the runbook for the DNS
cutover.

## Manual apply (rarely needed — CI owns this)

```bash
gcloud container fleet memberships get-credentials sparx-prod-autopilot --location global
kubectl apply -k k8s/        # Secrets must already exist in the namespace
kubectl -n kanninja get deploy,svc,pods
```
