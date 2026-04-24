# Bootstrap the kanninja namespace with the three Secrets the deploy requires:
#   1. ghcr-app-credentials  — GitHub App ID + Installation ID + private key
#   2. backend-secrets       — runtime env for the Fastify API
#   3. frontend-secrets      — CLERK_SECRET_KEY for the Next.js server
#
# Idempotent — every `create secret` is piped through `kubectl apply` via
# --dry-run=client so running this script twice is safe. Pulls non-config
# values from your local .env files (which are gitignored, not the ones
# baked into the image at build time).
#
# Run from the v2/k8s/ directory. Defaults assume the standard paths.

[CmdletBinding()]
param(
    [string]$BackendEnv        = "..\backend\.env",
    [string]$FrontendEnv       = "..\frontend\.env",
    [string]$GhcrPrivateKey    = ".\kanninja-deployer.2026-04-24.private-key.pem",
    [string]$GhcrAppId         = "3486525",
    [string]$GhcrInstallationId = "126646503",
    [string]$Namespace         = "kanninja",
    [string]$ExpectedContext   = "aks-ww-platform-prod-wu3",
    [switch]$SkipContextCheck,
    [switch]$SkipGhcr
)

$ErrorActionPreference = "Stop"

# Keys that belong in the ConfigMap, not the Secret. Keeps a dev .env with
# NODE_ENV=development from silently downgrading prod.
$ConfigMapKeys = @("NODE_ENV", "HOST", "HOSTNAME", "PORT", "FRONTEND_URL")

function Assert-Context {
    if ($SkipContextCheck) { return }
    $current = kubectl config current-context 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "kubectl isn't configured. Run: az aks get-credentials -g rg-ww-platform-prod-wu3 -n $ExpectedContext"
    }
    if ($current -ne $ExpectedContext) {
        Write-Host ""
        Write-Host "WARNING: current kubectl context is '$current', not '$ExpectedContext'." -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? (yes/no)"
        if ($confirm -ne "yes") { exit 1 }
    } else {
        Write-Host "Context OK: $current" -ForegroundColor Green
    }
}

function Assert-Namespace {
    kubectl get namespace $Namespace 2>$null 1>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Creating namespace $Namespace..."
        kubectl create namespace $Namespace | Out-Null
    } else {
        Write-Host "Namespace OK: $Namespace" -ForegroundColor Green
    }
}

function Read-EnvFile {
    param([string]$Path)
    $vars = @{}
    if (-not (Test-Path $Path)) { return $vars }
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Strip surrounding quotes
            if ($value -match '^"(.*)"$')  { $value = $matches[1] }
            elseif ($value -match "^'(.*)'$") { $value = $matches[1] }
            $vars[$key] = $value
        }
    }
    return $vars
}

function Upsert-EnvFileSecret {
    param(
        [string]$SecretName,
        [hashtable]$Vars
    )
    if ($Vars.Count -eq 0) {
        Write-Host "  Skipping ${SecretName}: no values found." -ForegroundColor Yellow
        return
    }
    $tempFile = [System.IO.Path]::GetTempFileName()
    try {
        $lines = @()
        foreach ($k in ($Vars.Keys | Sort-Object)) {
            # Skip empty values — Secret keys with empty values are useless noise.
            if ($Vars[$k] -eq '') { continue }
            $lines += "$k=$($Vars[$k])"
        }
        Set-Content -Path $tempFile -Value $lines -Encoding utf8

        $yaml = kubectl create secret generic $SecretName `
            --from-env-file=$tempFile `
            --namespace $Namespace `
            --dry-run=client -o yaml
        $yaml | kubectl apply -f -
        Write-Host "  Upserted ${SecretName} ($($lines.Count) keys)" -ForegroundColor Green
    } finally {
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
    }
}

function Upsert-GhcrCredentials {
    if ($SkipGhcr) { return }
    if (-not (Test-Path $GhcrPrivateKey)) {
        Write-Host "  Skipping ghcr-app-credentials: private key not found at $GhcrPrivateKey" -ForegroundColor Yellow
        Write-Host "  Pass -GhcrPrivateKey <path> if it's elsewhere, or -SkipGhcr to suppress." -ForegroundColor Yellow
        return
    }
    $yaml = kubectl create secret generic ghcr-app-credentials `
        --from-literal=app-id=$GhcrAppId `
        --from-literal=installation-id=$GhcrInstallationId `
        --from-file=private-key.pem=$GhcrPrivateKey `
        --namespace $Namespace `
        --dry-run=client -o yaml
    $yaml | kubectl apply -f -
    Write-Host "  Upserted ghcr-app-credentials" -ForegroundColor Green
}

# -------------------- main --------------------

Write-Host "kanNINJA cluster bootstrap"
Write-Host "=========================="

Assert-Context
Assert-Namespace

Write-Host ""
Write-Host "Reading $BackendEnv..."
$backend = Read-EnvFile -Path $BackendEnv
# Drop config-map-owned keys so a stale dev .env can't downgrade prod.
foreach ($k in $ConfigMapKeys) { $backend.Remove($k) | Out-Null }

Write-Host "Reading $FrontendEnv (CLERK_SECRET_KEY only)..."
$frontendAll = Read-EnvFile -Path $FrontendEnv
$frontend = @{}
if ($frontendAll.ContainsKey('CLERK_SECRET_KEY')) {
    $frontend['CLERK_SECRET_KEY'] = $frontendAll['CLERK_SECRET_KEY']
}

Write-Host ""
Write-Host "Applying Secrets to namespace $Namespace..."
Upsert-EnvFileSecret -SecretName "backend-secrets"  -Vars $backend
Upsert-EnvFileSecret -SecretName "frontend-secrets" -Vars $frontend
Upsert-GhcrCredentials

Write-Host ""
Write-Host "Verifying..."
kubectl -n $Namespace get secret backend-secrets frontend-secrets ghcr-app-credentials `
    -o custom-columns=NAME:.metadata.name,TYPE:.type,KEYS:.data | Select-Object -First 10

Write-Host ""
Write-Host "Done. Push to main to deploy." -ForegroundColor Green
