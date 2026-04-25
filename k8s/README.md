# kanNINJA on AKS

Kubernetes manifests for deploying the kanNINJA v2 frontend and backend to the `aks-ww-platform-prod-wu3` cluster in `rg-ww-platform-prod-wu3`.

## Architecture

```
Internet
   │
   ▼
NGINX Ingress (cluster)
   ├── kanninja.com, www.kanninja.com  →  Service: frontend:80  →  Pod: Next.js :3000
   └── api.kanninja.com                →  Service: backend:80   →  Pod: Fastify :3001
                                                                    │
                                                                    ▼
                                                          Supabase (external)
                                                          Clerk     (external)
                                                          Stripe    (external)
```

- **MCP server** (`kanninja-mcp`) is NOT deployed here — it's a stdio subprocess clients run locally. Its image is published to GHCR for containerised local use only.

## One-time setup

### 1. Azure OIDC for GitHub Actions

Create a federated credential so GitHub Actions can authenticate to Azure without long-lived secrets.

Run from a PowerShell 7+ session with the Azure CLI installed and `az login` already done:

```powershell
# Variables
$SubId    = az account show --query id -o tsv
$TenantId = az account show --query tenantId -o tsv
$Rg       = "rg-ww-platform-prod-wu3"
$Cluster  = "aks-ww-platform-prod-wu3"
$AppName  = "gh-kanninja-deploy"
$Repo     = "brandonkorous/kanninja"   # replace with your GH org/repo

# 1. Create an AAD app + service principal
$AppId = az ad app create --display-name $AppName --query appId -o tsv
az ad sp create --id $AppId

# 2. Federated credential for pushes to main
#    Pass JSON via a temp file — avoids PowerShell quoting quirks with `--parameters '{...}'`.
$FedCredJson = @"
{
  "name": "gh-main",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:$Repo`:ref:refs/heads/main",
  "audiences": ["api://AzureADTokenExchange"]
}
"@
$FedCredFile = New-TemporaryFile
Set-Content -Path $FedCredFile -Value $FedCredJson -Encoding utf8
az ad app federated-credential create --id $AppId --parameters "@$($FedCredFile.FullName)"
Remove-Item $FedCredFile

# 3. Grant AKS access (cluster user + RBAC writer for kubectl apply)
$ClusterId = az aks show -g $Rg -n $Cluster --query id -o tsv
az role assignment create --assignee $AppId `
    --role "Azure Kubernetes Service Cluster User Role" --scope $ClusterId
az role assignment create --assignee $AppId `
    --role "Azure Kubernetes Service RBAC Cluster Admin" --scope $ClusterId

# 4. Print values to paste into GitHub secrets
"AZURE_CLIENT_ID=$AppId"
"AZURE_TENANT_ID=$TenantId"
"AZURE_SUBSCRIPTION_ID=$SubId"
```

> **Note on the `repo:$Repo`:...`** in the JSON: the backtick before `:` is PowerShell's escape so the colon is treated as a literal, not as a scope separator. Leave it as shown.

### 2. GitHub repository secrets

Set these under **Settings → Secrets and variables → Actions**:

| Secret                              | Purpose                           |
| ----------------------------------- | --------------------------------- |
| `AZURE_CLIENT_ID`                   | OIDC app (step 1)                 |
| `AZURE_TENANT_ID`                   | OIDC app (step 1)                 |
| `AZURE_SUBSCRIPTION_ID`             | OIDC app (step 1)                 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Baked into frontend at build time |
| `NEXT_PUBLIC_SUPABASE_URL`          | Baked into frontend at build time |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | Baked into frontend at build time |

### 3. GHCR pull auth via a GitHub App

Images stay private. No PATs. Pull credentials are minted by a GitHub App, rotated in-cluster every ~50 minutes by a CronJob, and never tied to a human user.

**Architecture:**

```
GitHub App (org-scoped, packages:read)
       │  private key (only long-lived credential)
       ▼
Secret: ghcr-app-credentials  ← created manually, once
       │
       ▼
CronJob: ghcr-token-rotator (every 50 min)
       │  mints 1-hour installation token
       ▼
Secret: ghcr-pull-secret  ← updated by the rotator, consumed by Deployments
       │
       ▼
Backend / Frontend Pods  →  ghcr.io
```

**One-time setup (the App is already created; this captures the credential into the cluster).**

You should already have:

- App ID (e.g. `3486525`)
- Installation ID (e.g. `126646503`)
- Private key `.pem` file (placed in `v2/k8s/` and gitignored)

Create the Secret that feeds the rotator:

```powershell
kubectl -n kanninja create secret generic ghcr-app-credentials `
    --from-literal=app-id="3486525" `
    --from-literal=installation-id="126646503" `
    --from-file=private-key.pem="./private-key.pem"
```

Verify the rotator is wired up after the first deploy:

```powershell
# Should show the CronJob
kubectl -n kanninja get cronjob ghcr-token-rotator

# Should show the pull secret (created by the prime step in the workflow)
kubectl -n kanninja get secret ghcr-pull-secret

# See a recent rotation run
kubectl -n kanninja logs -l job-name=ghcr-token-rotator --tail=20
```

**If you ever need to rotate the App's private key:**

1. In the App settings, **Generate a private key**. A new `.pem` downloads.
2. Re-run the `kubectl create secret generic ghcr-app-credentials ...` command above with `--save-config=true --dry-run=client -o yaml | kubectl apply -f -` (or `kubectl delete` first).
3. Next CronJob tick picks up the new key automatically — no Deployment restart needed.
4. Delete the old key in the App settings.

**Private key never leaves your machine + the cluster.** It's explicitly listed in both `.gitignore` and `k8s/.gitignore`.

### 4. Application secrets — set individual GitHub Actions secrets

Every runtime value the cluster needs is stored as its **own** GitHub Actions repository secret. The deploy workflow reads each one individually, filters out empty ones, and upserts the three cluster Secrets (`backend-secrets`, `frontend-secrets`, `ghcr-app-credentials`) on every run.

Set them at **Settings → Secrets and variables → Actions → New repository secret**.

#### Required (workflow fails fast if any are empty)

Just what the server strictly needs to boot and verify auth requests:

| GH Actions secret | Goes into K8s Secret as | Notes |
|---|---|---|
| `SUPABASE_URL` | `backend-secrets.SUPABASE_URL` | |
| `SUPABASE_SERVICE_ROLE_KEY` | `backend-secrets.SUPABASE_SERVICE_ROLE_KEY` | |
| `DATABASE_URL` | `backend-secrets.DATABASE_URL` | |
| `CLERK_SECRET_KEY` | `backend-secrets.CLERK_SECRET_KEY` + `frontend-secrets.CLERK_SECRET_KEY` | Same value used in both |
| `GHCR_APP_PRIVATE_KEY` | `ghcr-app-credentials.private-key.pem` | Full `.pem` contents incl. BEGIN/END lines |

#### Feature-level (add when you enable the feature)

The backend's env schema has `.default('')` on all of these and the code paths check for emptiness before using them. The workflow won't block if they're missing — the corresponding feature just won't work.

| GH Actions secret | Goes into K8s Secret as | Feature |
|---|---|---|
| `CLERK_WEBHOOK_SECRET` | `backend-secrets.CLERK_WEBHOOK_SECRET` | Clerk → `/api/webhooks/clerk` syncs user profiles |
| `STRIPE_SECRET_KEY` | `backend-secrets.STRIPE_SECRET_KEY` | Subscriptions / billing |
| `STRIPE_WEBHOOK_SECRET` | `backend-secrets.STRIPE_WEBHOOK_SECRET` | Stripe → `/api/webhooks/stripe` |
| `OPENAI_API_KEY` | `backend-secrets.OPENAI_API_KEY` | AI features (Pro+ tier) |
| `INTEGRATION_ENCRYPTION_KEY` | `backend-secrets.INTEGRATION_ENCRYPTION_KEY` | Encrypts OAuth tokens for integrations at rest. **64-char hex** (32 bytes). Generate once, keep stable — if this changes, every integration connected before the change stops working. See below. |

**Generate an `INTEGRATION_ENCRYPTION_KEY`** (do this now even if you're not using integrations yet — starting with a stable value means you never have to migrate):

```powershell
# PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })
```

```bash
# Bash (if you prefer)
openssl rand -hex 32
```

#### Not currently needed

- **`CLERK_PUBLISHABLE_KEY`** — declared in `backend/env.ts` but never read by any backend code. The frontend already bakes it in at build time from the `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` secret. Don't create a separate `CLERK_PUBLISHABLE_KEY` secret — it does nothing.
- **`STRIPE_PUBLISHABLE_KEY`** / **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** — the frontend doesn't import `@stripe/stripe-js` yet. Add this secret when/if you wire up client-side Stripe.js. For server-side billing (Checkout Sessions, Customer Portal, webhooks), `STRIPE_SECRET_KEY` alone is enough.

#### Optional — webhook + OAuth providers

Set these only for integrations you actually use. Empty/unset values are quietly skipped (the backend's env schema has `.default('')` on all of them, and the workflow doesn't create empty K8s secret keys).

| GH Actions secret | Goes into K8s Secret as |
|---|---|
| `CLERK_WEBHOOK_SECRET` | `backend-secrets.CLERK_WEBHOOK_SECRET` |
| `STRIPE_WEBHOOK_SECRET` | `backend-secrets.STRIPE_WEBHOOK_SECRET` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `backend-secrets.GOOGLE_CLIENT_ID`, `.GOOGLE_CLIENT_SECRET` |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` | `backend-secrets.SLACK_*` |
| **`GH_APP_CLIENT_ID`**, **`GH_APP_CLIENT_SECRET`**, **`GH_APP_WEBHOOK_SECRET`** | `backend-secrets.GITHUB_CLIENT_ID`, `.GITHUB_CLIENT_SECRET`, `.GITHUB_WEBHOOK_SECRET` (see note below) |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | `backend-secrets.MICROSOFT_*` |
| `ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET` | `backend-secrets.ATLASSIAN_*` |
| `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_INSTANCE_URL` | `backend-secrets.GITLAB_*` |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY` | `backend-secrets.DISCORD_*` |
| `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` | `backend-secrets.NOTION_*` |
| `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` | `backend-secrets.FIGMA_*` |
| `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` | `backend-secrets.LINEAR_*` |
| `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET` | `backend-secrets.DROPBOX_*` |
| `LOOM_CLIENT_ID`, `LOOM_CLIENT_SECRET` | `backend-secrets.LOOM_*` |
| `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET` | `backend-secrets.ZENDESK_*` |
| `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET` | `backend-secrets.INTERCOM_*` |
| `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | `backend-secrets.HUBSPOT_*` |
| `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` | `backend-secrets.SALESFORCE_*` |

> **The `GH_APP_*` gotcha:** GitHub reserves the `GITHUB_` prefix for secret names — you can't create a repo secret called `GITHUB_CLIENT_ID`. Name those three secrets `GH_APP_CLIENT_ID`, `GH_APP_CLIENT_SECRET`, `GH_APP_WEBHOOK_SECRET` in GitHub Actions; the workflow remaps them back to `GITHUB_*` keys when writing to `backend-secrets` (which is what the backend's `env.ts` expects).

#### Non-secret identifiers

| Value | Where it lives | Notes |
|---|---|---|
| GitHub App ID (`3486525`) | `env.GHCR_APP_ID` in [deploy.yml](../.github/workflows/deploy.yml) | Visible in App URL, not secret |
| GitHub App Installation ID (`126646503`) | `env.GHCR_APP_INSTALLATION_ID` in [deploy.yml](../.github/workflows/deploy.yml) | Visible in install URL, not secret |

#### Rotation

Update the value in GitHub → push any commit (or re-run the workflow via `workflow_dispatch`) → the next deploy rewrites the cluster Secret. Pods pick up the new value on their next restart:

```powershell
kubectl -n kanninja rollout restart deploy/backend deploy/frontend
```

Each GH Actions secret is independently rotatable and audit-logged — a single compromised key doesn't force you to re-cycle the whole bundle.

### 5. DNS

Get the NGINX ingress controller's external IP:

```powershell
kubectl -n ingress-nginx get svc ingress-nginx-controller
```

Create DNS A records:

- `kanninja.com` → that IP
- `www.kanninja.com` → that IP
- `api.kanninja.com` → that IP

cert-manager will issue Let's Encrypt certs automatically once DNS resolves and the ingress is applied.

### 6. Verify cert-manager ClusterIssuer name

The ingress references `letsencrypt-prod`. Check yours:

```powershell
kubectl get clusterissuer
```

If the name differs, update `cert-manager.io/cluster-issuer` in [ingress.yaml](ingress.yaml).

## Deploy

### Automatic

Push to `main`. The [deploy workflow](../.github/workflows/deploy.yml) will:

1. Build + push backend, frontend, and MCP images to GHCR (tagged with git SHA)
2. Log into Azure via OIDC, pull AKS credentials
3. Pin image tags in `kustomization.yaml`, `kubectl apply -k .`
4. Wait for rollout status

### Manual

```powershell
az aks get-credentials -g rg-ww-platform-prod-wu3 -n aks-ww-platform-prod-wu3
kubectl apply -k v2/k8s
kubectl -n kanninja rollout status deploy/backend
kubectl -n kanninja rollout status deploy/frontend
```

## Day-to-day

```powershell
# Logs
kubectl -n kanninja logs -f deploy/backend
kubectl -n kanninja logs -f deploy/frontend

# Shell into a pod
kubectl -n kanninja exec -it deploy/backend -- sh

# Restart a deployment
kubectl -n kanninja rollout restart deploy/backend

# Rollback
kubectl -n kanninja rollout undo deploy/backend
```

## Resource sizing

Current per-pod sizing is intentionally small for low-traffic launch:

| Service  | CPU req | CPU limit | Mem req | Mem limit |
| -------- | ------- | --------- | ------- | --------- |
| backend  | 50m     | 500m      | 128Mi   | 512Mi     |
| frontend | 50m     | 500m      | 192Mi   | 512Mi     |

Bump `replicas` and/or resources in the deployment YAMLs as traffic grows. Add HPAs when scaling rules matter.

## Environment variable reference

Every env var lives in one of four places depending on where it's read and whether it's a secret.

### GitHub Actions → repository secrets

Read by the deploy workflow. Set under **Settings → Secrets and variables → Actions**.

| Var                                 | Type   | Purpose                                    |
| ----------------------------------- | ------ | ------------------------------------------ |
| `AZURE_CLIENT_ID`                   | secret | OIDC federated credential (step 1)         |
| `AZURE_TENANT_ID`                   | secret | OIDC federated credential (step 1)         |
| `AZURE_SUBSCRIPTION_ID`             | secret | OIDC federated credential (step 1)         |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | secret | Baked into frontend image at `docker build` |
| `NEXT_PUBLIC_SUPABASE_URL`          | secret | Baked into frontend image at `docker build` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`     | secret | Baked into frontend image at `docker build` |

> `NEXT_PUBLIC_API_URL` is hardcoded to `https://api.kanninja.com` in [deploy.yml](../.github/workflows/deploy.yml). Change it there if the API hostname ever moves.

> The four Clerk URL vars (`NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `…_SIGN_UP_URL`, `…_AFTER_SIGN_IN_URL`, `…_AFTER_SIGN_UP_URL`) have safe defaults baked into [Dockerfile.frontend](../Dockerfile.frontend). Add them as build-args only if you need to override `/sign-in`, `/sign-up`, `/dashboard`, `/dashboard`.

### Kubernetes ConfigMaps (non-secret, runtime)

Defined in [configmap.yaml](configmap.yaml). Edit there if a value changes.

| ConfigMap         | Var            | Default                  |
| ----------------- | -------------- | ------------------------ |
| `backend-config`  | `NODE_ENV`     | `production`             |
| `backend-config`  | `HOST`         | `0.0.0.0`                |
| `backend-config`  | `PORT`         | `3001`                   |
| `backend-config`  | `FRONTEND_URL` | `https://kanninja.com`   |
| `frontend-config` | `NODE_ENV`     | `production`             |
| `frontend-config` | `HOSTNAME`     | `0.0.0.0`                |
| `frontend-config` | `PORT`         | `3000`                   |

### Kubernetes Secret: `backend-secrets` (runtime, Fastify API)

Values mirror [backend/src/config/env.ts](../backend/src/config/env.ts). Fill in [secret.example.yaml](secret.example.yaml) or create via `--from-env-file`.

**Required for the app to start:**

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`

**Required for auth / payments / AI:**

- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY`

**Required for the integration system:**

- `INTEGRATION_ENCRYPTION_KEY` — 64-char hex string (32 bytes). Generate in PowerShell:
  ```powershell
  -join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Max 256) })
  ```

**OAuth providers (fill only the ones you've enabled):**

| Provider                                     | Vars                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Google (Calendar, Gmail, Drive, Docs)        | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                                    |
| Slack                                        | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`              |
| GitHub                                       | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET`           |
| Microsoft (Teams, Outlook, OneDrive)         | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`       |
| Atlassian (Jira, Bitbucket, Confluence)      | `ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET`                              |
| GitLab                                       | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_INSTANCE_URL` (optional)  |
| Discord                                      | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY` |
| Notion                                       | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`                                    |
| Figma                                        | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`                                      |
| Linear                                       | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`                                    |
| Dropbox                                      | `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET`                                  |
| Loom                                         | `LOOM_CLIENT_ID`, `LOOM_CLIENT_SECRET`                                        |
| Zendesk                                      | `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`                                  |
| Intercom                                     | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET`                                |
| HubSpot                                      | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`                                  |
| Salesforce                                   | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`                            |

All OAuth vars have empty-string defaults in `env.ts` — the server starts without them, but that provider's OAuth flow fails at runtime.

### Kubernetes Secret: `frontend-secrets` (runtime, Next.js server)

| Var                 | Required | Purpose                                                                                                                                     |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLERK_SECRET_KEY`  | **yes**  | Read by Clerk's Next.js middleware and any `@clerk/nextjs/server` call. Protected routes will 500 without it. Same value as in `backend-secrets`. |

### Adding a new env var — checklist

When you add a new `env.VAR_NAME` reference in the backend:

1. Declare it in [backend/src/config/env.ts](../backend/src/config/env.ts) with Zod validation
2. Add it to [secret.example.yaml](secret.example.yaml) under `backend-secrets`
3. Add a row to the table above
4. Set the real value in the cluster: `kubectl -n kanninja edit secret backend-secrets` (or re-apply)
5. Restart the deployment: `kubectl -n kanninja rollout restart deploy/backend`

For a new `NEXT_PUBLIC_*` frontend var:

1. Reference it in frontend code (`process.env.NEXT_PUBLIC_X`)
2. Add an `ARG`/`ENV` pair in [Dockerfile.frontend](../Dockerfile.frontend)
3. Add it as a GitHub secret and pass it as `build-args` in [deploy.yml](../.github/workflows/deploy.yml)
4. Re-run the workflow — the value is baked in at image build time, not injected at runtime
