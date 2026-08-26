<#
.SYNOPSIS
    Run the Supabase -> Azure Postgres data migration as an in-cluster Job.

.DESCRIPTION
    Wraps scripts/data-migration/migrate-data.sh. That script does the work; this
    one puts it somewhere it can reach both databases, and streams the result
    back.

    WHY A JOB AND NOT A LOCAL SCRIPT. The Azure server has
    `public_network_access_enabled = false` and lives in a delegated subnet.
    Nothing outside the VNet can reach it — not this workstation, not a
    GitHub-hosted runner, not with a firewall rule, because there is no public
    endpoint to allow. A pod on the cluster is inside the VNet and can also
    reach Supabase over ordinary egress, which makes it the only place both
    databases exist at once.

    Both connection strings come from Key Vault and are written to a Secret that
    exists only for the run. Neither ever touches this machine's disk.

.PARAMETER Mode
    preflight  Report versions, the table intersection and source row counts.
               Changes nothing. RUN THIS FIRST, AND RUN IT AGAINST A REHEARSAL
               SERVER BEFORE THE REAL ONE.
    run        Perform the migration.
    verify     Re-compare row counts against a migration that already ran.

.PARAMETER Namespace
    Defaults to kanninja.

.PARAMETER VaultName
    Defaults to kv-kanninja-prod-cus. Must contain DATABASE-ADMIN-URL (written
    by Terraform) and SUPABASE-DATABASE-URL (set by hand — see below).

.EXAMPLE
    # One-time: teach the vault where the source is.
    az keyvault secret set --vault-name kv-kanninja-prod-cus `
      --name SUPABASE-DATABASE-URL `
      --value 'postgresql://postgres:...@db.nttpitmzjxfddplwauzv.supabase.co:5432/postgres?sslmode=require'

    ./scripts/run-data-migration.ps1 -Mode preflight
    ./scripts/run-data-migration.ps1 -Mode run
#>
[CmdletBinding()]
param(
    [ValidateSet('preflight', 'run', 'verify')]
    [string]$Mode = 'preflight',

    [string]$Namespace = 'kanninja',
    [string]$VaultName = 'kv-kanninja-prod-cus',

    # postgres:18-alpine carries pg_dump 18. The source is PostgreSQL 17.4, and
    # pg_dump refuses a server NEWER than itself — dumping an OLDER one is
    # supported and routine. So this must be >= the source's major version, and
    # pinning it forward is the safe direction. Do not "match" it to 17.
    [string]$Image = 'postgres:18-alpine'
)

$ErrorActionPreference = 'Stop'
$JobName = 'data-migration'
$scriptPath = Join-Path $PSScriptRoot 'data-migration/migrate-data.sh'

if (-not (Test-Path $scriptPath)) { throw "Missing $scriptPath" }

Write-Host "mode      : $Mode"
Write-Host "namespace : $Namespace"
Write-Host "vault     : $VaultName"
Write-Host "image     : $Image`n"

# --- context check -----------------------------------------------------------
# Applying this to the wrong cluster is not a recoverable mistake, so confirm
# which one kubectl is pointed at rather than assuming the last `az aks
# get-credentials` is still in effect.
$ctx = (kubectl config current-context).Trim()
Write-Host "kubectl context: $ctx"
if ($ctx -notlike '*aks-sparx-prod*') {
    throw "Refusing to run: kubectl is pointed at '$ctx', which is not the AKS production cluster. Run: az aks get-credentials -g rg-sparx-prod-cus -n aks-sparx-prod-cus"
}

kubectl get namespace $Namespace *> $null
if ($LASTEXITCODE -ne 0) { throw "Namespace '$Namespace' does not exist. Deploy first." }

# --- credentials -------------------------------------------------------------
Write-Host "`nReading connection strings from Key Vault..."
$target = az keyvault secret show --vault-name $VaultName --name DATABASE-ADMIN-URL --query value -o tsv
if ($LASTEXITCODE -ne 0 -or -not $target) { throw "DATABASE-ADMIN-URL not found in $VaultName. Terraform writes it — has envs/azure been applied?" }

$source = az keyvault secret show --vault-name $VaultName --name SUPABASE-DATABASE-URL --query value -o tsv 2>$null
if ($LASTEXITCODE -ne 0 -or -not $source) {
    throw @"
SUPABASE-DATABASE-URL not found in $VaultName.

This is the one credential Terraform does not own, because it belongs to the
system being migrated AWAY from. Set it with:

  az keyvault secret set --vault-name $VaultName --name SUPABASE-DATABASE-URL --value '<connection string>'

Delete it once the migration is verified — it is a live credential to a database
that is about to become a rollback copy, and it has no purpose afterwards.
"@
}
Write-Host "  both present."

# The Secret is recreated each run so a rotated credential is picked up, and it
# holds ONLY what the Job needs. Deliberately not reusing `backend-secrets`:
# nothing that serves traffic should be able to read the source database.
kubectl create secret generic data-migration-creds -n $Namespace `
    --from-literal=SOURCE_URL="$source" `
    --from-literal=TARGET_URL="$target" `
    --dry-run=client -o yaml | kubectl apply -f - | Out-Null

# --- script ------------------------------------------------------------------
# NORMALISED TO LF BEFORE IT SHIPS, and this is not cosmetic.
#
# Git checks *.sh out with CRLF on Windows, `kubectl create configmap
# --from-file` stores the bytes verbatim, and bash inside the container then
# reads `set -euo pipefail\r` and fails with:
#
#     bash: line 1: set: pipefail: invalid option name
#
# The carriage return is invisible in every editor and in `kubectl get cm -o
# yaml`, so the error reads as a broken script rather than a line-ending
# problem. .gitattributes now pins *.sh to LF, but this conversion stays: it
# makes the Job correct even from a checkout that predates that rule, or from
# a tree where someone's editor rewrote the file.
$scriptLf = [IO.File]::ReadAllText($scriptPath) -replace "`r`n", "`n"
$tmpScript = Join-Path ([IO.Path]::GetTempPath()) "migrate-data-$([guid]::NewGuid().ToString('N')).sh"
[IO.File]::WriteAllText($tmpScript, $scriptLf, (New-Object Text.UTF8Encoding $false))

try {
    kubectl create configmap data-migration-script -n $Namespace `
        --from-file=migrate-data.sh=$tmpScript `
        --dry-run=client -o yaml | kubectl apply -f - | Out-Null
}
finally {
    Remove-Item $tmpScript -Force -ErrorAction SilentlyContinue
}

# --- job ---------------------------------------------------------------------
kubectl delete job $JobName -n $Namespace --ignore-not-found | Out-Null

# backoffLimit 0: every failure path in the script is one a human should read.
# A retry would re-run a script that deliberately refuses to touch a
# half-migrated database, so the second attempt only obscures the first.
#
# The ConfigMap is mounted at a path the script does not write to, and copied
# before running: a ConfigMap mount is READ-ONLY, and `bash script.sh` is fine
# with that, but the mode bits are not executable.
$job = @"
apiVersion: batch/v1
kind: Job
metadata:
  name: $JobName
  namespace: $Namespace
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 3600
  template:
    spec:
      restartPolicy: Never
      enableServiceLinks: false
      containers:
        - name: migrate
          image: $Image
          command: ['bash', '/scripts/migrate-data.sh', '$Mode']
          envFrom:
            - secretRef:
                name: data-migration-creds
          volumeMounts:
            - { name: script, mountPath: /scripts, readOnly: true }
            - { name: work, mountPath: /tmp }
          resources:
            requests: { cpu: '100m', memory: '256Mi' }
            limits:   { cpu: '1000m', memory: '1Gi' }
      volumes:
        - name: script
          configMap: { name: data-migration-script }
        - name: work
          emptyDir: {}
"@

$job | kubectl apply -f - | Out-Null
Write-Host "`nJob '$JobName' created. Streaming logs...`n" -ForegroundColor Cyan

# Wait for the pod to exist before following, otherwise `kubectl logs -f` races
# scheduling and exits immediately with "pod has no logs".
$deadline = (Get-Date).AddMinutes(5)
do {
    Start-Sleep -Seconds 2
    $pod = (kubectl get pods -n $Namespace -l "job-name=$JobName" -o jsonpath='{.items[0].metadata.name}' 2>$null)
    $phase = if ($pod) { (kubectl get pod $pod -n $Namespace -o jsonpath='{.status.phase}' 2>$null) } else { $null }
} while (-not $phase -and (Get-Date) -lt $deadline)

if (-not $pod) { throw "Job pod never scheduled. Check: kubectl describe job $JobName -n $Namespace" }

kubectl logs -f "job/$JobName" -n $Namespace

# `kubectl logs -f` returning does not mean the Job succeeded — it means the
# stream ended. Ask for the actual condition.
kubectl wait --for=condition=complete "job/$JobName" -n $Namespace --timeout=30s *> $null
$ok = ($LASTEXITCODE -eq 0)

# Always remove the credentials, success or failure. The ConfigMap is harmless
# and left for reference.
kubectl delete secret data-migration-creds -n $Namespace --ignore-not-found | Out-Null

Write-Host ''
if ($ok) {
    Write-Host "Job completed successfully." -ForegroundColor Green
    if ($Mode -eq 'run') {
        Write-Host @"

Next:
  - Supabase is untouched and is the rollback. Keep it 30 days.
  - Delete SUPABASE-DATABASE-URL from the vault once you are satisfied.
  - The auth_* tables are empty by design; the Clerk user import is separate
    (docs/migration-runbook.md, Track D Phase 2).
"@
    }
}
else {
    Write-Host "Job did NOT complete. The log above is the reason; read it before retrying." -ForegroundColor Red
    Write-Host "The script refuses to touch a half-migrated database, so a blind re-run will stop rather than compound it."
    exit 1
}
