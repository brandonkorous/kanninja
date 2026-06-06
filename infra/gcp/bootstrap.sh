#!/usr/bin/env bash
# kanNINJA → GKE bootstrap (one-time GCP setup on project sparxworks).
#
# Provisions the additive GCP resources kanNINJA needs to deploy onto the
# shared sparx-prod-autopilot cluster. Everything here is NEW and namespaced to
# "kanninja-*" so it never collides with sparx's own resources/Terraform state.
#
# Idempotent: every step is create-if-absent, so re-running is safe.
#
# Prereqs: gcloud authenticated as an owner/editor of sparxworks.
#   Run:  bash v2/infra/gcp/bootstrap.sh
set -euo pipefail

PROJECT_ID="sparxworks"
PROJECT_NUMBER="631794111842"
REGION="us-central1"
AR_REPO="kanninja"
DEPLOYER_SA="kanninja-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
# Autopilot pulls images with the default compute SA (verified via
# `gcloud container clusters describe ... nodeConfig.serviceAccount`).
NODE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
GITHUB_REPO="brandonkorous/kanninja"
POOL="kanninja-pool"
PROVIDER="kanninja-provider"

echo "==> 1/7  Artifact Registry repo: ${AR_REPO}"
gcloud artifacts repositories describe "$AR_REPO" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "$AR_REPO" \
       --repository-format=docker --location "$REGION" \
       --description="kanNINJA container images (backend, frontend, mcp-remote)" \
       --project "$PROJECT_ID"

echo "==> 2/7  Node SA reader on ${AR_REPO} (so Autopilot can pull)"
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location "$REGION" --project "$PROJECT_ID" \
  --member="serviceAccount:${NODE_SA}" \
  --role="roles/artifactregistry.reader" >/dev/null

echo "==> 3/7  Deployer service account: ${DEPLOYER_SA}"
gcloud iam service-accounts describe "$DEPLOYER_SA" --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam service-accounts create kanninja-deployer \
       --display-name="kanNINJA CD deployer" \
       --description="GitHub Actions: AR push + GKE deploy via Connect Gateway. No Terraform, no sparx app access." \
       --project "$PROJECT_ID"

echo "==> 4/7  Deployer: writer scoped to the ${AR_REPO} repo only"
gcloud artifacts repositories add-iam-policy-binding "$AR_REPO" \
  --location "$REGION" --project "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}" \
  --role="roles/artifactregistry.writer" >/dev/null

echo "==> 5/7  Deployer: cluster access (Connect Gateway + deploy)"
# NOTE: container.developer is PROJECT-WIDE k8s write. Pragmatic for an urgent
# co-tenant migration; tighten to a kanninja-namespace RBAC RoleBinding later
# (see README "Hardening").
for ROLE in roles/container.developer roles/gkehub.gatewayEditor roles/gkehub.viewer; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" \
    --member="serviceAccount:${DEPLOYER_SA}" --role="$ROLE" \
    --condition=None >/dev/null
done

echo "==> 6/7  Workload Identity pool + provider (locked to ${GITHUB_REPO})"
gcloud iam workload-identity-pools describe "$POOL" --location global --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools create "$POOL" \
       --location global --display-name="kanNINJA GitHub Actions" \
       --description="OIDC federation for kanNINJA CI" --project "$PROJECT_ID"

gcloud iam workload-identity-pools providers describe "$PROVIDER" \
  --location global --workload-identity-pool "$POOL" --project "$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam workload-identity-pools providers create-oidc "$PROVIDER" \
       --location global --workload-identity-pool "$POOL" \
       --display-name="GitHub OIDC provider" \
       --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
       --attribute-condition="assertion.repository == '${GITHUB_REPO}'" \
       --issuer-uri="https://token.actions.githubusercontent.com" \
       --project "$PROJECT_ID"

echo "==> 7/7  Let ${GITHUB_REPO} impersonate the deployer SA"
gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_SA" \
  --project "$PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/attribute.repository/${GITHUB_REPO}" >/dev/null

echo
echo "Done. deploy.yml WIF_PROVIDER should be:"
echo "  projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL}/providers/${PROVIDER}"
