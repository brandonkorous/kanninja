# Azure migration plan — finish the move

> ## COMPLETE — cut over 2026-08-26
>
> kanNINJA serves from Azure end to end. Verified from outside the cluster after
> the DNS flip:
>
> | check | result |
> |---|---|
> | `kanninja.com` | 200, certificate issued on first request |
> | `www.kanninja.com` | 301 to the apex |
> | `api.kanninja.com/api/health/ready` | `{"status":"ready"}` - a real `select 1` as `kanninja_app` |
> | `mcp.kanninja.com/health` | `{"status":"ok"}` |
> | `POST /api/auth/sign-in/email` | `INVALID_EMAIL_OR_PASSWORD` on bad credentials |
> | password-reset email | code delivered and confirmed received |
>
> 2,963 rows migrated, 49 foreign keys re-applied, 9 profiles each linked to a
> Better Auth user. Everything below this banner is history; the punch list is
> here.
>
> ### What is NOT done
>
> **1. Avatar preservation - TIME-BOXED, do before deleting Clerk.**
> All 9 `profiles.avatar_url` values point at `img.clerk.com`. They are fetchable
> only while the Clerk instance exists; once it is deleted they are gone and every
> user drops to initials. kanNINJA has **no avatar upload path at all** - Clerk
> supplied every image, and `avatarUrl` is only ever read.
>
> Building upload is a separate, unhurried job with one decision worth making
> deliberately: card attachments use short-lived SAS URLs, which is right for
> private files and wrong for `<img src>` (the URL expires and caching breaks).
> Either a public container with unguessable paths, or stream through the API the
> way sparx does for media.
>
> **2. Cleanup.**
> - `SUPABASE-DATABASE-URL` in Key Vault - a live credential to a deleted project
> - `data-migration-creds` Secret in the `kanninja` namespace
> - `v2/infra/gcp/` - documents a cluster nobody can reach
> - `.github/workflows/seed-keyvault.yml` - one-shot, never needed
> - the Clerk code (8 files). **Already inert**: no `CLERK_*` key was ever loaded
>   into the vault, so the legacy branch in `require-auth.ts` cannot activate.
>   Removing it is cosmetic, not a cutover step.
> - 5 dead Clerk DNS records in Cloudflare: `accounts`, `clerk`, `clk._domainkey`,
>   `clk2._domainkey`, `clkmail`
> - `img.clerk.com` and `*.supabase.co` in `frontend/next.config.ts`
> - this document, and `docs/deployment.md`, which still describe the move as
>   pending
>
> **3. Blocked - the GCP account is unreachable.**
> The GKE `kanninja` namespace, the Artifact Registry repo, the `kanninja-pool`
> WIF provider and the `kanninja-deployer` service account all still exist and
> keep billing. They cannot be deleted, and there is no rollback to GKE.
>
> ### Two things that cost the most time
>
> **Local verification lied, five times.** Every CI failure was masked by state a
> developer machine carries and a fresh checkout does not - a populated
> `node_modules` hid a stale lockfile, a leftover `mcp-server/dist` hid an unbuilt
> library, `backend/.env` hid a missing `DATABASE_URL`. Deleting `dist` alone is
> not enough either: `tsc` reads the leftover `tsconfig.tsbuildinfo`, emits
> nothing, and reports SUCCESS.
>
> **Four separate failures reported success while failing.** A green deploy, a
> green health check, and `{"success":true}` on an email Resend had rejected with
> a 403. The readiness/liveness split is the durable fix for one of them: only
> `/api/health/ready` runs `select 1`, so it is the only probe that can tell you
> the database is reachable.


Companion to [migration-runbook.md](./migration-runbook.md), which covers the
**application** migrations (Clerk → Better Auth, Supabase → Azure Postgres,
Supabase Storage → Blob, Supabase Realtime → WebSocket). That document is still
accurate about the app. This one covers the **infrastructure** move that it
assumed away — it was written when compute was staying on GKE.

Decisions taken 2026-08-25:

- **One cutover.** Better Auth ships with the Azure move. The branch's frontend
  is Better Auth only, so there is no split that does not mean untangling
  commits written together. Every user re-logs in once.
- **`B_Standard_B1ms`** for kanNINJA's Postgres, matching sparx and jotDOJO.
  The runbook's `Standard_D2ds_v5` was chosen for a cross-cloud hop that no
  longer exists.
- **Real data migrates.** Supabase stays alive 30 days as the rollback.

---

## Current state

| | Where it runs today | Where it lands |
|---|---|---|
| frontend / backend / mcp-remote | GKE `sparx-prod-autopilot`, ns `kanninja` | AKS `aks-sparx-prod-cus`, ns `kanninja` |
| Postgres | Supabase | `psql-kanninja-prod-cus` (own server) |
| Auth | Clerk | Better Auth, in-process |
| Attachments | Supabase Storage | `stkanninjaprodcus` / `card-attachments` |
| Secrets | ~60 GitHub Actions secrets | `kv-kanninja-prod-cus` (own vault) |
| Images | Artifact Registry | `ghcr.io/brandonkorous/kanninja/*` |
| Ingress | shared Caddy (GKE) | shared Caddy (AKS) — **host blocks already written** |

All application code lives uncommitted on `migrate/better-auth-azure`. It
typechecks clean. **No Azure infrastructure exists for kanNINJA** — verified
against the live subscription and against `grep -ri kanninja sparx.works`.

jotDOJO is the working precedent for every piece of this: own server, own vault,
own storage, own identity, own repo, co-tenant on the shared cluster and the
shared Caddy. Clone `jotacular.tf`, minus its AI section.

---

## Gates — resolve before anything else

**Gate 1 — Clerk password digests. Probably not worth clearing.** *(revised
2026-08-25 against the live data)*

The runbook treats this as the first and hardest gate: export the CSV, confirm
`password_digest` / `password_hasher` are populated, possibly open a Clerk
support request, then run `migrate-clerk-users --passwords`, then watch the
bcrypt→scrypt conversion plateau and force-reset the stragglers.

**There are 10 users.** All 10 carry a `clerk_user_id`; 4 have been active in
the last 90 days. That machinery exists to avoid inconveniencing a large user
base, and at this size the inconvenience it avoids is smaller than the risk it
adds — a password-hash import that silently mismaps is a much worse outcome than
ten people clicking "Forgot password".

Recommend: **skip `--passwords` entirely.** Import the accounts (so identities,
Google links and every foreign key survive), mail the ten, and put the banner on
`/sign-in`. Keep the gate only if you would rather not send that email.

Either way the decision is still yours and still cannot be made mid-cutover.

> **Avatars, same reasoning.** All 10 `avatar_url` values point at
> `img.clerk.com` and die with the Clerk instance. At 10 users, "accept initials"
> is a legitimate answer; a backfill is also an hour's work. Decide, rather than
> discovering it.

**Gate 2 — GKE static egress IPs. DISSOLVED.** The runbook made this a hard
blocker because Azure Postgres was to be public-access with a firewall allowing
Cloud NAT. Moving compute into the VNet removes the question entirely. Ignore
that section.

**Gate 3 — Postgres major version.** The runbook says 17; `envs/azure` defaults
to 18. Take **18** — the baseline uses no extensions and no `setval`
reconciliation (every PK is `uuid DEFAULT gen_random_uuid()`). Confirm the
migration Job's `pg_dump` client version is **≥ the Supabase server version**,
or the dump fails at the version check.

**Gate 4 — DPA subprocessor notice.** External clock, so start it now. Supabase
and Clerk leave the list; Microsoft Azure joins (database, storage, compute);
Resend joins (transactional email). **Google Cloud now leaves too** — the
runbook had it staying as application hosting, which is no longer true.

**Gate 5 — the TLS bootstrap trap. CLOSED** *(found and fixed 2026-08-25;
released 2026-08-25T12:22Z and verified live)*

kanNINJA's Caddy host blocks existed already and used `import tls_managed` — an
explicit managed certificate issued at startup. **That can never work on this
ingress.** The shared Caddy is `replicas: 1` on a `Recreate` rollout, so every
boot has a ~15–60s window with no registered load-balancer backend, and
certmagic spends all of its startup issuance attempts inside it. No ACME
challenge reaches the origin, no first certificate is ever obtained, and
Cloudflare answers **525 for that hostname alone** — which reads like a routing
bug and is a TLS bootstrap failure.

silicaui was blocked by exactly this and moved to on-demand; the comment in
`domain-check.ts` cited "kanNINJA-style explicit managed blocks" as the
alternative it avoided, which was accurate about what kanNINJA did and wrong
about whether it worked. Both halves of the fix are now committed to the repo:

- `k8s/ingress/Caddyfile` — all four blocks `import tls_policy`
- `domain-check.ts` — `kanninja.com`, `www.`, `api.`, `mcp.` added to
  `PLATFORM_HOSTNAMES`, without which on-demand 403s `unknown_host` and the
  result is the same 525

These are two edits that must ship **together**. Either alone leaves the
hostnames with no certificate.

---

## Phase 1 — Azure infrastructure (`sparx.works`, Terraform)

> **Status: APPLIED** (2026-08-25). Live in `rg-sparx-prod-cus`:
>
> | Resource | Value |
> |---|---|
> | Postgres | `psql-kanninja-prod-cus` — PG 18, `Standard_B1ms`, 32 GiB, public access **Disabled**, state Ready |
> | Database | `kanninja` |
> | Key Vault | `kv-kanninja-prod-cus` — 10 Terraform-owned secrets present |
> | Storage | `stkanninjaprodcus` / `card-attachments` (private), CORS `GET,HEAD,PUT,OPTIONS` from `https://kanninja.com` |
> | Subnet | `snet-psql-kanninja` `10.20.16.32/28` |
> | CI identity | `gha-kanninja-prod`, client `1d3c51d4-4ee7-4b17-bba6-87c7daa6e71a` |
> | Azure OpenAI | `oai-kanninja-prod-eus2` (eastus2) — deployment `kanninja-speech`, whisper-001, **Standard** SKU, capacity 1 |
>
> Repo variables `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` /
> `AZURE_SUBSCRIPTION_ID` / `AZURE_KEY_VAULT_NAME` are set on
> `brandonkorous/kanninja`.
>
> **DNS records are NOT applied** — `kanninja_dns_enabled` is still `false`.
> That is the Phase 5 cutover switch. The AKS ingress they will point at is
> **20.12.217.0**.
>
> Applied in three steps, not two, because the vault's data-plane RBAC is
> granted in `bootstrap-azure` while the secrets are written from `envs/azure`:
> **infra → bootstrap (RBAC) → secrets**. Subscription Owner does *not* confer
> Key Vault data access on an RBAC-authorized vault, so a single apply 403s on
> the six secrets.

### 1a. `terraform/envs/azure/kanninja.tf`

Model on `jotacular.tf`. Drop the entire `azurerm_cognitive_account` /
`azurerm_cognitive_deployment` section — kanNINJA calls OpenAI directly through
`OPENAI_API_KEY`.

- `variable "kanninja_enabled"`, default `true`
- `azurerm_subnet.kanninja_postgres` — **`10.20.16.32/28`**
  (sparx `10.20.16.0/28`, jotacular `10.20.16.16/28`), delegated to
  `Microsoft.DBforPostgreSQL/flexibleServers`, with
  `service_endpoints = ["Microsoft.Storage"]` — declaring it is not decoration,
  see the note in `main.tf`
- `azurerm_postgresql_flexible_server.kanninja` — `psql-kanninja-prod-cus`,
  `B_Standard_B1ms`, 32 GiB, admin `kanninja_owner`, `public_network_access_enabled = false`,
  reusing the **shared** `azurerm_private_dns_zone.postgres`, `prevent_destroy`
- `azurerm_postgresql_flexible_server_database.kanninja` — `kanninja`
- **No `azure.extensions` resource.** kanNINJA's migrations contain zero
  `CREATE EXTENSION`. Adding one would be inert; leaving it out is honest.
- `azurerm_key_vault.kanninja` — `kv-kanninja-prod-cus`, RBAC authorization,
  standard SKU, 7-day soft delete
- `azurerm_storage_account.kanninja` — `stkanninjaprodcus`, LRS, Hot, container
  `card-attachments` (private). **CORS on the ACCOUNT**, not the container:
  origins `https://kanninja.com`, methods `GET PUT OPTIONS`, headers must
  include `x-ms-blob-type` — Azure requires it on a direct PUT, which makes it
  non-safelisted and part of the preflight. Its absence is what broke every
  upload on sparx's Blob cutover with no server-side trace.
- `random_password` × `kanninja_owner`, `kanninja_app`, `better_auth_secret`
- `azurerm_key_vault_secret.kanninja` `for_each` over the secret map

Key Vault secret names use **hyphens** (`DATABASE-URL`), and the workflow maps
`_` → `-` on read. Terraform owns these six; every other secret is loaded by
hand once (§2f):

`DATABASE-URL` · `DATABASE-ADMIN-URL` · `KANNINJA-APP-PASSWORD` ·
`BETTER-AUTH-SECRET` · `AZURE-STORAGE-ACCOUNT` · `AZURE-STORAGE-KEY`

The server admin password is **not** a vault secret — it is already inside
`DATABASE-ADMIN-URL`, and is exposed as a sensitive Terraform output for
incident use. jotDOJO publishes its equivalent because sparx has to read it to
bootstrap a role on a server jotDOJO does not own; that does not apply here.

### 1b. `terraform/bootstrap-azure/kanninja.tf`

- `azuread_application` + `azuread_service_principal` — `gha-kanninja-prod`
- Federated credentials: `:ref:refs/heads/main` and `:environment:prod`
- **Subject prefix is `repo:brandonkorous/kanninja`** — the plain legacy form.
  Verified 2026-08-25 via
  `gh api repos/brandonkorous/kanninja/actions/oidc/customization/sub --jq .sub_claim_prefix`.
  jotacular carries the newer numeric-qualified form
  (`repo:owner@id/repo@id`) because it is a newer repository. **Do not copy
  jotacular's.** A mismatch fails every run with AADSTS700213, and the error
  names only the subject it received, never the one expected.
- Role assignments: `Key Vault Secrets User` on `kv-kanninja-prod-cus` (scoped
  to the vault — this is the whole reason kanNINJA gets its own),
  `Azure Kubernetes Service Cluster User Role` at subscription scope,
  `Key Vault Secrets Officer` for the operator and the sparx release SP
- Output the four `gh variable set` commands

**Apply order is `envs/azure` → `bootstrap-azure`**, because the bootstrap reads
the vault as a data source. Wrong order gives a clean plan-time "Key Vault not
found", not a mystery.

### 1c. `terraform/modules/dns`

A `kanninja.com` block guarded by `kanninja_dns_enabled`: `@` (A), `www`
(CNAME to the apex), `api` and `mcp` (A) → `azurerm_public_ip.ingress`.

**No `import` blocks**, unlike jotacular. Import preserves a record's current
value while adopting it; here the current value is a *Google* address that must
change anyway, and every record in this module already sets
`allow_overwrite = true`. One apply repoints them.

Which is exactly why **`kanninja_dns_enabled` defaults to `false`** — the only
brand in the module that does. kanNINJA is live. Turning this on is not "begin
managing these records", it is **the DNS cutover**, and it belongs in Phase 5
with workloads already running, not in whichever apply happens to come next.
The `module "dns"` call in `ingress.tf` carries the same warning where an
operator would actually look.

---

## Phase 2 — Re-target the kanNINJA repo

> **Status: code complete, NOT deployed** (2026-08-25). `deploy.yml` parses,
> `kubectl kustomize k8s` builds 10 resources on GHCR images, and
> `pnpm --filter @kanninja/backend run build` emits `dist/db/migrate.js` — the
> exact path the migration Job invokes.
>
> **Three manual steps remain before the first deploy can succeed:**
>
> 1. **Load the vault.** Eight required secrets are still absent:
>    `RESEND-API-KEY`, `GOOGLE-AUTH-CLIENT-ID`, `GOOGLE-AUTH-CLIENT-SECRET`,
>    `STRIPE-SECRET-KEY`, `STRIPE-WEBHOOK-SECRET`, `INTEGRATION-ENCRYPTION-KEY`,
>    `MCP-JWT-SECRET`, `MCP-S2S-TOKEN`.
>
>    Six of those exist as GitHub Actions secrets and can be recovered without
>    anyone reading them, via
>    [`.github/workflows/seed-keyvault.yml`](../.github/workflows/seed-keyvault.yml)
>    — but **Actions secrets are write-only to every API**, so the only reader
>    is a workflow, which means that file has to reach `main` first and the
>    deploy identity needs a temporary `Key Vault Secrets Officer` grant.
>
>    `RESEND-API-KEY` and the `GOOGLE-AUTH-*` pair are absent from GitHub too —
>    correctly, because Resend and the separate sign-in OAuth client are both
>    **new** for Better Auth (runbook Track D Phase 0). They were always going
>    to be created fresh. Use
>    [`scripts/load-keyvault.ps1`](../scripts/load-keyvault.ps1) for those.
>
>    Of the six, only **`MCP-JWT-SECRET`** genuinely must be preserved: it signs
>    MCP access tokens and there are 1064 outstanding. `STRIPE-*` are viewable
>    in the Stripe dashboard, `INTEGRATION-ENCRYPTION-KEY` can be regenerated
>    freely (0 rows in `integration_connections`), and `MCP-S2S-TOKEN` rotates
>    safely because both sides read the new value.
>
>    `OPENAI-API-KEY` is **no longer required** — built-in AI was removed, and
>    the variable survives in `env.ts` read by nothing. `AZURE-OPENAI-API-KEY`
>    replaced it in the required list and is already in the vault, written by
>    Terraform.
> 2. ~~Make the GHCR packages public~~ — **already done.** The packages are
>    `ghcr.io/brandonkorous/kanninja-{backend,frontend,mcp-remote}` (HYPHEN),
>    public, with tag history back to the first AKS deployment. Verified by
>    anonymous pull against ghcr.io, the same path the kubelet takes.
>
>    This nearly went wrong: the workflow was first written against
>    `kanninja/backend` (slash), a namespace that has never existed. The first
>    deploy would have failed on a 401 reading like a missing tag, while the
>    real, public images sat untouched beside it.
> 3. ~~Apply the Caddy + `PLATFORM_HOSTNAMES` change~~ (Gate 5) — **already
>    released**, 2026-08-25T12:22Z, by the sparx pipeline. The mounted
>    ConfigMap matches the repo, and the live allow-list endpoint answers 200
>    for all four kanNINJA hostnames and 403 for everything else.

### 2a. Registry: Artifact Registry → GHCR

`ghcr.io/brandonkorous/kanninja/{backend,frontend,mcp-remote}`, published
**public** so no `imagePullSecrets` are needed — same as jotDOJO and sparx. The
existing `build-mcp` job already logs into GHCR; reuse its pattern for the other
three.

### 2b. Rewrite `.github/workflows/deploy.yml`

Model on `jotDOJO/.github/workflows/release.yml`.

- Delete `google-github-actions/auth`, the WIF env block, and the Connect
  Gateway step
- `azure/login@v2` with `AZURE_CLIENT_ID` / `AZURE_TENANT_ID` /
  `AZURE_SUBSCRIPTION_ID` repository **variables** (not secrets — they are
  public identifiers)
- `az aks get-credentials -g rg-sparx-prod-cus -n aks-sparx-prod-cus`
- **Replace the ~60-secret `env:` block with a Key Vault read loop.** This is
  the single biggest cleanup in the migration: one vault, `az keyvault secret
  show`, `_`→`-` name mapping, a `required` list that fails the run loudly and
  an optional list that does not. Adding a secret becomes
  `az keyvault secret set` and nothing else moves.
- **Add a `db-migrate` Job.** kanNINJA has no migration path at all today —
  `deployment.md` admits `drizzle/` is not in the runtime image, so migrations
  are run by hand from a laptop. That is impossible once the server is
  private-endpoint only. `backoffLimit: 0`, `ttlSecondsAfterFinished: 600`,
  `DATABASE_ADMIN_URL` from the Secret.
- **Add a `db-role` Job.** The `kanninja_app` role does not exist — the
  docker-entrypoint init SQL convention is not something Azure will ever run.
  Create it once, idempotently, using the owner URL.

Keep `verify` (typecheck + test) gating every build, unchanged.

### 2c. `Dockerfile.backend`

Currently copies only `dist`, `node_modules`, `package.json`. Add
`COPY --from=build /out/drizzle ./drizzle` and keep `drizzle-kit` resolvable in
the runtime stage, or the migrate Job has nothing to apply.

### 2d. `k8s/`

Image names → GHCR in `kustomization.yaml` and all three Deployments. Update the
stale comment block explaining the GKE decisions. **Delete
`k8s/kanninja-deployer.2026-04-24.private-key.pem`** — a committed private key,
which should be rotated out regardless of this migration.

### 2e. Delete `infra/gcp/`

Last, in Phase 6.

### 2f. One-time Key Vault load

Everything Terraform does not own: Stripe, OpenAI, Resend, the Google sign-in
client, `INTEGRATION_ENCRYPTION_KEY`, `MCP_JWT_SECRET`, `MCP_S2S_TOKEN`, the
Clerk keys (kept through the rollback window), and the ~25 integration OAuth
client pairs. Pull the current values from GitHub Actions before deleting them
there.

---

## Phase 3 — Data

> **Status: tooling written and syntax-checked, NOT run** (2026-08-25).
> [`scripts/data-migration/migrate-data.sh`](../scripts/data-migration/migrate-data.sh)
> does the work; [`scripts/run-data-migration.ps1`](../scripts/run-data-migration.ps1)
> puts it in the cluster and streams the result.

### What the source actually contains

Measured against the live Supabase project `nttpitmzjxfddplwauzv` (**PostgreSQL
17.4**, us-west-1), not assumed:

| | |
|---|---|
| Tables in `public` | **36 — exactly matching the drizzle baseline** |
| Total rows | **~3,000** |
| Largest tables | `oauth_refresh_tokens` 1064 · `card_checklist_items` 761 · `cards` 455 |
| `profiles` | **10**, all 10 carrying `clerk_user_id` |
| `card_attachments` | **0** |
| Orphaned FK rows | **0, across all 47 foreign keys** |

Three consequences, each of which removes work the runbook assumed:

- **The referential-integrity report is already in.** Re-applying the foreign
  keys is the step most likely to fail, and it is pre-verified clean. Every FK
  is single-column, so there are no composite cases to reason about.
- **This is seconds of work, not a maintenance window.** ~3,000 rows.
- **Phase 4 has nothing to copy.** See below.

### How it runs

Azure Postgres is private-endpoint only and there is no `psql`/`pg_dump` on the
workstation, so the copy runs **as an in-cluster Job** — a pod reaches Supabase
over egress and Azure over the VNet, which nothing else can do.

```powershell
# One-time: the one credential Terraform does not own.
az keyvault secret set --vault-name kv-kanninja-prod-cus `
  --name SUPABASE-DATABASE-URL --value '<supabase connection string>'

./scripts/run-data-migration.ps1 -Mode preflight   # changes nothing
./scripts/run-data-migration.ps1 -Mode run
```

The script: takes the **table intersection** (the target's schema decides what
is copied, and anything source-only is reported rather than silently dropped) →
records every FK **into a table in the target** → drops them → truncates the
seeded `integration_providers` → `pg_dump -Fc` / `pg_restore --exit-on-error`
→ re-applies the FKs → `ANALYZE` → compares exact `count(*)` per table.

### Four corrections to the runbook

1. **No `--disable-triggers`.** It issues `ALTER TABLE ... DISABLE TRIGGER ALL`,
   which requires **superuser** — and an Azure Flexible Server admin is not one,
   so the restore would fail outright. It is also doubly unnecessary: the schema
   declares zero triggers, and the FKs are dropped for the duration anyway.
2. **`count(*)`, not `pg_stat_user_tables.n_live_tup`.** That column is an
   autovacuum *estimate*. Comparing an estimate against a restore is how a
   migration gets declared complete while rows are missing.
3. **FK definitions go in a table in the target, not a file.** Between the drop
   and the restore the database has no referential integrity; if the pod is
   evicted in that window a `/tmp` file dies with it, and a naive re-run would
   regenerate an *empty* FK list and then restore the data a second time on top
   of itself. The script detects that state and refuses.
4. **`pg_restore --exit-on-error`.** The default logs errors and continues,
   producing a "successful" restore with silently missing rows.

Then the Clerk user import and `backfill-profile-user-id` per the runbook's
Track D Phase 2 — but see Gate 1, which 10 users may make moot — and only once
the backfill gate is clean, apply `0003` (`NOT NULL` on `profiles.user_id`).

**Still rehearse against a throwaway server first.** Not for the duration, which
is now known to be trivial, but because `-Mode run` is the step with no undo
other than Supabase itself.

---

## Phase 4 — Storage

> **Nothing to migrate.** `card_attachments` holds **0 rows** in the live
> source, so there is no object copy, no `rclone`, and no legacy-download check.
> The entire track reduces to one post-cutover smoke test: upload an attachment
> and confirm it round-trips through the SAS flow against
> `stkanninjaprodcus/card-attachments`.

That test is not optional despite the emptiness — it exercises the part most
likely to be wrong, which is the **account-level CORS rule**, since the browser
PUTs and GETs blobs directly and the API only signs URLs. A missing origin fails
at preflight with no server-side trace.

---

## Phase 5 — Cutover

> **Status: tooling written and exercised against the live cluster** (2026-08-25).
> [`scripts/verify-cutover.ps1`](../scripts/verify-cutover.ps1) runs today and
> correctly reports 11 failures, because nothing is deployed yet. That is the
> expected pre-deploy reading.

### The probe fix this phase depended on

`/api/health` returns a static object and never touches the database — and all
three probes pointed at it. So a backend pod reported **Ready**, joined the
Service and took traffic with Postgres unreachable: the deploy went green, the
rollout succeeded, and every real request 500'd. On a migration whose entire
risk is the database moving, that is the failure mode that matters most.

Now split, which is the whole reason the dark deploy can prove anything:

| Probe | Path | Why |
|---|---|---|
| startup, liveness | `/api/health` | Failure **kills** the container. Restarting a pod does not repair a database — pointing these at the DB turns a brief Postgres blip into a fleet-wide crashloop that outlives its cause. |
| readiness | `/api/health/ready` | Failure **removes the pod from the Service** and leaves it running. Runs `select 1`, so a 200 proves the private DNS name resolves inside the VNet, TLS negotiates, `kanninja_app`'s password matches the vault, and the pool hands out a connection. |

### Order

**1. Dark deploy.** Push to `main`. The pipeline creates the namespace, syncs
secrets from Key Vault, runs `db-migrate` and `db-role`, and rolls out. DNS
still points at GKE, so this has **zero user impact** — a broken deploy here
costs nothing, which is the point of doing it days early.

**2. Verify.**

```powershell
./scripts/verify-cutover.ps1
```

It probes from **inside `sparx-prod`**, using the exact
`<svc>.kanninja.svc.cluster.local` addresses the Caddyfile uses, because that
cross-namespace path is what has to work at cutover. A port-forward would prove
something easier than the thing that must be true.

**What it cannot prove before DNS moves** — and therefore what to test first
*after* the flip, in this order:

1. **TLS.** Caddy issues on-demand, on the **first HTTPS request** to each
   hostname. That request cannot happen while the name resolves elsewhere.
2. **Session cookies.** Scoped to `.kanninja.com`; no sign-in flow is
   exercisable over a cluster-internal address.
3. **Google OAuth.** The callback is
   `https://api.kanninja.com/api/auth/callback/google`.

**3. Caddy + the allow-list** (Gate 5), together, in a coordinated window.
Rolling the shared Caddy pod affects sparx, jotDOJO and SilicaUI; a bad config
caused an outage on 2026-06-06.

**4. Freeze and move the data.** **Freeze at Supabase, not at GKE** — see
"The GKE cluster is unreachable" below. Rotate the Supabase database password
(dashboard → Settings → Database), which stops the old backend writing
immediately and cannot be undone by anything still running over there. Then:

```powershell
./scripts/run-data-migration.ps1 -Mode run   # seconds, at ~3,000 rows
```

Rotating the password also invalidates `SUPABASE-DATABASE-URL` in the vault, so
set the new value there **before** running the migration or the Job cannot read
the source.

**5. Flip DNS.** Set `kanninja_dns_enabled = true` and apply. The records are
`allow_overwrite`, so this repoints them from GKE to **20.12.217.0** in one
step. **Point of no return: the first successful write on Azure.**

**6. Smoke, in dependency order.** TLS on all four hostnames · password sign-in ·
Google sign-in (see Gate 1 — most users may be on this path) · fresh sign-up +
verification code · forgot password · a `ninja_live_*` API key call · an MCP JWT
call · the full MCP consent flow · two browsers on one board for presence and
realtime · **a Stripe webhook** · **an attachment upload round-trip** (the only
exercise the empty storage container ever gets, and the CORS rule is the part
most likely to be wrong).

### Constraints that do not bend

- **`replicas: 1` for the backend.** The realtime hub fans out per-pod; a second
  replica makes broadcasts silently partial. Redis pub/sub is the seam.
- **Rollback window is ~4 hours**, and only while `clerk_user_id` is populated
  and Clerk is live. Anyone who signs up during the Better Auth window has no
  `clerk_user_id` and will 401 — `require-auth.ts` rejects them deliberately
  rather than forking their data.
- **Rolling back DNS does not roll back the data.** Once Azure has taken writes,
  reverting `kanninja_dns_enabled` returns traffic to a GKE stack pointed at a
  Supabase database that has been standing still. Past step 5, fix forward.

### The GKE cluster is unreachable

*(2026-08-25 — `gcloud auth login` no longer available.)*

kanNINJA production currently serves from `sparx-prod-autopilot` in GCP, and
that cluster can no longer be administered. Three consequences, none of which
stop the migration but all of which change how it ends:

- **There is no rollback to GKE.** The 4-hour auth rollback window above assumed
  redeploying the old stack. That is gone. Past the DNS flip the only direction
  is forward, and the only safety net is Supabase-as-archive.
- **The freeze happens at the database**, because the pods cannot be scaled
  down. Rotating the Supabase password is the freeze.
- **Phase 6 cannot complete.** The GKE namespace, the Artifact Registry repo,
  the `kanninja-pool` WIF provider and the `kanninja-deployer` service account
  cannot be deleted, and the pods keep running — and billing — indefinitely.
  If the GCP account is recoverable at all, recovering it is worth doing for
  the teardown alone.

This raises the priority of finishing the cutover rather than lowering it: an
incident on the GKE stack today has no remedy.

---

## Phase 6 — Decommission

- **T+0** — **BLOCKED while GCP is unreachable.** The GKE `kanninja` namespace,
  the Artifact Registry repo, the `kanninja-pool` WIF provider, the
  `kanninja-deployer` service account and the GCP DNS records all require an
  account nobody can log into. They will keep existing, and the pods will keep
  billing. `infra/gcp/` can still be deleted from the repo — it documents a
  cluster that can no longer be reached, which makes it actively misleading.
- **T+7d** — Clerk legacy branch out of `require-auth.ts`, drop `@clerk/fastify`
  and `svix`, delete `routes/auth/webhooks.ts` and the `CLERK_*` vault secrets.
  Watch the bcrypt→scrypt migration plateau first.
- **T+14d** — drop `profiles.clerk_user_id`, remove `img.clerk.com` from
  `next.config.ts`, delete the Clerk instance. **Take a final export first.**
- **T+30d** — Supabase project. Not before.

> **Avatars.** Existing `profiles.avatar_url` values point at `img.clerk.com`
> and die with the Clerk instance. Backfill them into Blob Storage or accept
> initials. Decide deliberately.

---

## Capacity note

`aks-sparx-prod-cus` is a **single** `Standard_D4ads_v7`: 52 of 110 pods,
memory requests at 47%, limits already 205% overcommitted. kanNINJA's three pods
add ~450 Mi of requests, which fits. If it stops fitting, the move is
**`node_size`, not `node_count`** — a second node pays the AKS memory
reservation twice, splits free memory into two pools that cannot host one large
pod, and buys zero availability while every Deployment is `replicas: 1`. The
reasoning is on the `node_size` variable in `envs/azure/variables.tf`.
