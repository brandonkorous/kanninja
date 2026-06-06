# kanNINJA on GKE — migration runbook

kanNINJA v2 was migrated off **AKS** onto the shared **`sparx-prod-autopilot`**
GKE cluster (project `sparxworks`, `us-central1`), in its own `kanninja`
namespace. This is a deliberate co-tenant arrangement ("here for now, maybe move
later") — kanNINJA's GCP resources are all namespaced `kanninja-*` and isolated
from sparx's own infra/Terraform.

## What's already done (in code + on GCP)

| Area | State |
|------|-------|
| Manifests (`k8s/`) | Images → Artifact Registry; `imagePullSecrets` + GHCR rotator + nginx Ingress removed |
| `deploy.yml` | Rewritten: WIF auth, AR push, **Connect Gateway** to the private control plane, `kubectl apply -k` |
| Artifact Registry | Repo `us-central1-docker.pkg.dev/sparxworks/kanninja` created; node SA granted reader |
| WIF | Pool `kanninja-pool` + provider `kanninja-provider`, locked to `brandonkorous/kanninja` |
| Deployer SA | `kanninja-deployer@sparxworks.iam` — AR writer (repo-scoped) + `container.developer` + `gkehub.gateway*` |
| Namespace | `kanninja` pre-created on the cluster |
| Caddy | kanNINJA host blocks added to `sparx.works/k8s/caddy/Caddyfile` — **validated, NOT applied** |

**Why Connect Gateway, not the public endpoint:** the cluster has authorized
networks locked + a private endpoint. Connect Gateway (fleet membership) reaches
the control plane via Google's proxy with IAM — no IP allowlists, no cluster
network change. Mirrors `sparx.works/.github/workflows/deploy-prod.yml`.

**Why Caddy, not nginx:** the cluster has no nginx-ingress/cert-manager. The
shared Caddy reverse proxy (`sparx-prod` ns, LB `35.254.145.54`) routes all
hosts. kanNINJA's blocks use Caddy's normal auto-TLS (NOT sparx's `on_demand`,
which would reject `kanninja.com` at its domain-check ask endpoint).

## Remaining steps (in order — do these to go live)

### 1. Apply the Caddy change ⚠️ coordinate — touches sparx prod
The Caddyfile edit lives in the **sparx repo**. Applying it rolls the shared
Caddy pod (a hash-suffixed ConfigMap forces a clean rollout). A bad Caddy config
caused a sparx outage on 2026-06-06 — apply in a coordinated window.

```bash
# from the sparx.works repo, authed to the cluster (Connect Gateway):
kubectl apply -k k8s/caddy
kubectl -n sparx-prod rollout status deploy/caddy
```
Routing is now live but certs won't issue until DNS points here (step 3).

### 2. Ship the kanNINJA repo changes → first deploy
Merge the `deploy.yml` + `k8s/` changes to `main` (or run the workflow manually).
The first run builds all images to AR, bootstraps the cluster Secrets from the
existing GitHub Actions secrets, applies the manifests, and waits for rollout.

```bash
# verify after it finishes:
kubectl -n kanninja get deploy,svc,pods
```
Pods should be Running before the DNS cutover (Caddy 502s until they are).

### 3. Repoint DNS → `35.254.145.54`
Point these at the Caddy LB. **Keep them DNS-only (grey cloud / no proxy) until
certs issue**, then optionally re-enable Cloudflare proxy with SSL = Full(strict).

| Host | Type | Value |
|------|------|-------|
| `kanninja.com` | A | `35.254.145.54` |
| `www.kanninja.com` | A | `35.254.145.54` |
| `api.kanninja.com` | A | `35.254.145.54` |
| `mcp.kanninja.com` | A | `35.254.145.54` |

Caddy mints Let's Encrypt certs on first HTTPS request. Verify:
```bash
for h in kanninja.com api.kanninja.com mcp.kanninja.com; do
  curl -fsSL --max-time 10 "https://$h/" >/dev/null && echo "OK $h" || echo "FAIL $h"
done
```

### 4. Cleanup
- **GitHub Actions secrets** (kanNINJA repo): app secrets (Supabase/Clerk/Stripe/
  …) are reused as-is — no new secrets needed (WIF is keyless). You can delete the
  now-unused `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and
  `GHCR_APP_PRIVATE_KEY`.
- **Stray key**: delete `v2/k8s/kanninja-deployer.2026-04-24.private-key.pem`
  (gitignored, but it's the obsolete GHCR App key) and revoke that GitHub App —
  the rotator is gone.
- **AKS**: once GKE is verified, tear down the Azure cluster
  (`rg-ww-platform-prod-wu3`) to stop paying for it.

## Cost
Marginal pod cost on Autopilot only (~150m CPU / ~450Mi RAM requested total).
**No new load balancer** (reuses sparx's Caddy LB). No separate control-plane fee.

## Hardening (follow-ups, not blockers)
- `kanninja-deployer` has project-wide `container.developer` (can write any
  namespace, incl. `sparx-prod`). Tighten to a `kanninja`-namespace RBAC
  RoleBinding + drop the project role once the migration is stable.
- Caddy is single-replica with an RWO cert PVC (`Recreate`) — a brief blip on
  every Caddy roll affects sparx + kanNINJA together. Sparx's "Phase 2"
  distributed cert storage would fix this for both.

## Teardown (if kanNINJA leaves this cluster)
```bash
kubectl delete namespace kanninja
# remove the kanNINJA blocks from sparx Caddyfile, re-apply k8s/caddy
gcloud artifacts repositories delete kanninja --location us-central1 --project sparxworks
gcloud iam service-accounts delete kanninja-deployer@sparxworks.iam.gserviceaccount.com --project sparxworks
gcloud iam workload-identity-pools delete kanninja-pool --location global --project sparxworks
```
