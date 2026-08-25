<#
.SYNOPSIS
    Load kanNINJA's application secrets into Azure Key Vault.

.DESCRIPTION
    Terraform owns six secrets in kv-kanninja-prod-cus — the ones it generates or
    derives (DATABASE-URL, DATABASE-ADMIN-URL, KANNINJA-APP-PASSWORD,
    BETTER-AUTH-SECRET, AZURE-STORAGE-ACCOUNT, AZURE-STORAGE-KEY). This script
    loads everything else: Stripe, OpenAI, Resend, the Google sign-in client, the
    MCP token pair, and the integration OAuth clients.

    WHY THIS IS NOT AUTOMATIC, AND CANNOT BE. GitHub Actions secrets are
    WRITE-ONLY — there is no API that returns their values, to anyone, ever. So
    the ~50 credentials currently living there cannot be migrated by a script
    reading them; each has to come from wherever it originally came from (the
    Stripe dashboard, the Google console, a password manager). This script takes
    a local env file, pushes it, and then tells you exactly what the deploy will
    still refuse to start without.

    Run it once before the first AKS deploy. After that, a single credential is
    just:
        az keyvault secret set --vault-name kv-kanninja-prod-cus --name STRIPE-SECRET-KEY --value '...'

.PARAMETER EnvFile
    A dotenv-style file, KEY=VALUE per line. Use the ENV VAR name
    (STRIPE_SECRET_KEY); underscores are converted to hyphens for Key Vault,
    which rejects underscores outright. Blank lines and # comments are ignored.

    Treat this file as a live credential bundle: write it outside the repo, and
    delete it when you are done. The script refuses to read one from inside the
    working tree for that reason.

.PARAMETER VaultName
    Defaults to kv-kanninja-prod-cus.

.PARAMETER WhatIf
    Show what would be set, without setting it. Values are never printed.

.EXAMPLE
    ./scripts/load-keyvault.ps1 -EnvFile $HOME/kanninja-prod.env -WhatIf
    ./scripts/load-keyvault.ps1 -EnvFile $HOME/kanninja-prod.env
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile,

    [string]$VaultName = 'kv-kanninja-prod-cus'
)

$ErrorActionPreference = 'Stop'

# The deploy workflow's `required` list, verbatim. Keep the two in step: a name
# that is required there and absent here produces a red deploy whose cause is
# three files away.
#
# These are required because each one FAILS QUIETLY. An absent RESEND_API_KEY is
# a signup that accepts the form and never sends the code; an absent
# STRIPE_WEBHOOK_SECRET is an endpoint that rejects every event while the deploy
# goes green.
$Required = @(
    'AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_KEY', # Terraform-owned, listed to verify
    'DATABASE_URL', 'BETTER_AUTH_SECRET',         # Terraform-owned, listed to verify
    'RESEND_API_KEY',
    'GOOGLE_AUTH_CLIENT_ID', 'GOOGLE_AUTH_CLIENT_SECRET',
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'INTEGRATION_ENCRYPTION_KEY',
    'MCP_JWT_SECRET', 'MCP_S2S_TOKEN'
)

# Written by Terraform. If one of these appears in the env file it is a mistake
# worth stopping for: overwriting DATABASE-URL by hand desynchronises the vault
# from the state that generated it, and the next `terraform apply` silently puts
# its own value back — so the hand-edit appears to work and then reverts.
$TerraformOwned = @(
    'DATABASE_URL', 'DATABASE_ADMIN_URL', 'KANNINJA_APP_PASSWORD',
    'BETTER_AUTH_SECRET', 'AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_KEY'
)

if (-not (Test-Path $EnvFile)) { throw "Env file not found: $EnvFile" }

$resolved = (Resolve-Path $EnvFile).Path
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if ($resolved.StartsWith($repoRoot, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to read a credential file from inside the repository ($resolved). Move it outside the working tree."
}

Write-Host "Vault : $VaultName"
Write-Host "Source: $resolved`n"

$parsed = @{}
foreach ($line in Get-Content -LiteralPath $resolved) {
    $t = $line.Trim()
    if ($t -eq '' -or $t.StartsWith('#')) { continue }
    $i = $t.IndexOf('=')
    if ($i -lt 1) { Write-Warning "Skipping unparseable line: $($t.Substring(0, [Math]::Min(24, $t.Length)))..."; continue }
    $name = $t.Substring(0, $i).Trim()
    $value = $t.Substring($i + 1).Trim()
    # Strip one layer of surrounding quotes, which dotenv files usually carry and
    # Key Vault would otherwise store as part of the secret.
    if ($value.Length -ge 2 -and (($value[0] -eq '"' -and $value[-1] -eq '"') -or ($value[0] -eq "'" -and $value[-1] -eq "'"))) {
        $value = $value.Substring(1, $value.Length - 2)
    }
    if ($value -eq '') { Write-Warning "Skipping $name — empty value."; continue }
    $parsed[$name] = $value
}

Write-Host "Parsed $($parsed.Count) value(s) from the env file.`n"

$conflicts = $parsed.Keys | Where-Object { $TerraformOwned -contains $_ }
if ($conflicts) {
    throw @"
The env file contains secrets Terraform owns: $($conflicts -join ', ')

Setting these by hand desynchronises the vault from the Terraform state that
generated them, and the next apply silently restores its own value — so the
change appears to work and then reverts. Remove them from the file and let
terraform/envs/azure/kanninja.tf write them.
"@
}

$set = 0
foreach ($name in ($parsed.Keys | Sort-Object)) {
    $kvName = $name.Replace('_', '-')
    if ($PSCmdlet.ShouldProcess("$VaultName/$kvName", 'set secret')) {
        az keyvault secret set --vault-name $VaultName --name $kvName --value $parsed[$name] --output none
        if ($LASTEXITCODE -ne 0) { throw "Failed to set $kvName" }
        Write-Host "  set $kvName"
        $set++
    }
    else {
        Write-Host "  would set $kvName"
    }
}

Write-Host "`n$set secret(s) written.`n"

# ---------------------------------------------------------------------------
# Report against what the deploy actually demands, reading the vault back rather
# than trusting what we just wrote — a secret disabled or soft-deleted in the
# portal still 'exists' to a naive check.
# ---------------------------------------------------------------------------
Write-Host 'Checking the deploy''s required list against the vault...'
$present = (az keyvault secret list --vault-name $VaultName --query '[].name' -o tsv) -split "`n" |
    ForEach-Object { $_.Trim() } | Where-Object { $_ }

$missing = @()
foreach ($name in $Required) {
    if ($present -notcontains $name.Replace('_', '-')) { $missing += $name }
}

if ($missing.Count -gt 0) {
    Write-Host ''
    Write-Warning "The deploy will FAIL until these exist in ${VaultName}:"
    $missing | ForEach-Object { Write-Host "    $($_.Replace('_','-'))" }
    Write-Host ''
    Write-Host 'Set one with:'
    Write-Host "    az keyvault secret set --vault-name $VaultName --name <NAME> --value '...'"
    exit 1
}

Write-Host 'All required secrets are present. The deploy has what it needs to start.' -ForegroundColor Green
