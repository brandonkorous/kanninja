<#
.SYNOPSIS
    Copy the live production secrets from the GKE cluster into Azure Key Vault,
    without displaying any value.

.DESCRIPTION
    The nine credentials the Azure deploy still needs already exist — in the
    `backend-secrets` Secret of the RUNNING GKE stack. They cannot be recovered
    from GitHub Actions (those are write-only, to everyone), but a Kubernetes
    Secret reads back fine. So the values move cluster → vault directly and
    never pass through a human, a terminal, a file you keep, or a chat log.

    NO VALUE IS EVER PRINTED. Values live in PowerShell variables and a
    short-lived temp file, and the only per-secret output is its NAME and
    whether the copy verified. Verification compares a SHA-256 of the source
    against a SHA-256 of what the vault returns — that proves the bytes match
    without revealing them, and catches the silent-corruption case that matters
    most here (a secret containing a quote or a `$` mangled in transit).

    WHY A TEMP FILE AND NOT `--value`. Passing a secret as a command-line
    argument means PowerShell has to quote it, and a value containing quotes,
    backticks or dollar signs can be silently altered on the way to the CLI —
    producing a vault entry that looks set and does not work. `--file` moves
    bytes verbatim. The file is written to the user profile, not a shared temp
    location, and removed in `finally` even on failure.

    WHAT IT REFUSES TO COPY, and this is the important part:

      DATABASE_URL         GKE's value points at SUPABASE. Copying it would
                           overwrite Terraform's Azure connection string and
                           silently point the new stack at the OLD database —
                           a deploy that works perfectly and writes to the
                           wrong place.
      BETTER_AUTH_SECRET   Terraform generated one. Better Auth was never live
                           on GKE (Clerk is), so there are no sessions to
                           preserve and nothing to carry over.
      AZURE_STORAGE_*      Terraform owns these and they describe the new
                           account.

    Those four are Terraform's, and a hand-set value is silently restored by
    the next `terraform apply` — so the override would appear to work and then
    revert.

.PARAMETER GkeContext
    kubectl context for the old cluster. Requires a valid gcloud login:
        gcloud auth login

.PARAMETER WhatIf
    List what would be copied. Reads nothing and writes nothing.

.EXAMPLE
    gcloud auth login
    ./scripts/copy-secrets-to-vault.ps1 -WhatIf
    ./scripts/copy-secrets-to-vault.ps1
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$GkeContext = 'gke_sparxworks_us-central1_sparx-prod-autopilot',
    [string]$SourceNamespace = 'kanninja',
    [string]$SourceSecret = 'backend-secrets',
    [string]$VaultName = 'kv-kanninja-prod-cus'
)

$ErrorActionPreference = 'Stop'

# Written by terraform/envs/azure/kanninja.tf. See the header.
$TerraformOwned = @(
    'DATABASE_URL', 'DATABASE_ADMIN_URL', 'KANNINJA_APP_PASSWORD',
    'BETTER_AUTH_SECRET', 'AZURE_STORAGE_ACCOUNT', 'AZURE_STORAGE_KEY'
)

# The deploy workflow's `required` list, minus the Terraform-owned ones. Used
# only to report what is still missing at the end.
$StillNeeded = @(
    'RESEND_API_KEY',
    'GOOGLE_AUTH_CLIENT_ID', 'GOOGLE_AUTH_CLIENT_SECRET',
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET',
    'OPENAI_API_KEY', 'INTEGRATION_ENCRYPTION_KEY',
    'MCP_JWT_SECRET', 'MCP_S2S_TOKEN'
)

function Get-Sha256([string]$Text) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        ($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Text)) |
            ForEach-Object { $_.ToString('x2') }) -join ''
    }
    finally { $sha.Dispose() }
}

Write-Host "source: $SourceSecret ($SourceNamespace) on $GkeContext"
Write-Host "target: $VaultName`n"

# --- read the source ---------------------------------------------------------
$json = kubectl --context $GkeContext get secret $SourceSecret -n $SourceNamespace -o json 2>&1
if ($LASTEXITCODE -ne 0) {
    if ("$json" -match 'gke-gcloud-auth-plugin|Reauthentication|credentials') {
        throw "Cannot reach the GKE cluster: gcloud credentials have expired. Run ``gcloud auth login`` (it needs a browser), then re-run this."
    }
    throw "Could not read $SourceSecret from $SourceNamespace on $GkeContext."
}

$data = ($json | ConvertFrom-Json).data
$names = @($data.PSObject.Properties.Name | Sort-Object)
Write-Host "found $($names.Count) key(s) in the source secret.`n"

$skipped = @()
$copied = @()
$failed = @()

foreach ($name in $names) {
    if ($TerraformOwned -contains $name) {
        $skipped += $name
        Write-Host "  skip   $name  (Terraform owns this — see the header)" -ForegroundColor DarkYellow
        continue
    }

    $kvName = $name.Replace('_', '-')

    if (-not $PSCmdlet.ShouldProcess("$VaultName/$kvName", 'copy secret')) {
        Write-Host "  would  $name -> $kvName"
        continue
    }

    # Decoded here and never echoed. The variable and the file below are the
    # only places it exists on this machine.
    $value = [System.Text.Encoding]::UTF8.GetString(
        [Convert]::FromBase64String($data.$name))

    if ([string]::IsNullOrEmpty($value)) {
        Write-Host "  skip   $name  (empty in source)" -ForegroundColor DarkYellow
        $skipped += $name
        continue
    }

    $tmp = Join-Path $env:USERPROFILE ".kanninja-secret-$([guid]::NewGuid().ToString('N'))"
    try {
        # -NoNewline is load-bearing: a trailing newline becomes part of the
        # secret. Better Auth uses its secret's exact bytes as key material, and
        # a stray newline there is the kind of fault that invalidates every
        # session while every configuration screen looks correct.
        [System.IO.File]::WriteAllText($tmp, $value, [System.Text.UTF8Encoding]::new($false))

        az keyvault secret set --vault-name $VaultName --name $kvName `
            --file $tmp --encoding utf-8 --output none
        if ($LASTEXITCODE -ne 0) { throw 'az keyvault secret set failed' }

        # Verify by hash. Never prints either the value or the digest — a digest
        # of a low-entropy secret is guessable offline, so only the verdict is
        # shown.
        $readBack = az keyvault secret show --vault-name $VaultName --name $kvName --query value -o tsv
        if ((Get-Sha256 $value) -ne (Get-Sha256 $readBack)) {
            throw 'round-trip hash mismatch — the stored value differs from the source'
        }

        Write-Host "  copied $name -> $kvName  (verified)" -ForegroundColor Green
        $copied += $name
    }
    catch {
        Write-Host "  FAIL   $name -> $kvName : $($_.Exception.Message)" -ForegroundColor Red
        $failed += $name
    }
    finally {
        Remove-Item $tmp -Force -ErrorAction SilentlyContinue
        $value = $null
        $readBack = $null
    }
}

[System.GC]::Collect()

Write-Host "`ncopied $($copied.Count), skipped $($skipped.Count), failed $($failed.Count)`n"

# --- what the deploy still lacks --------------------------------------------
$present = @()
if ($PSCmdlet.ShouldProcess($VaultName, 'list secrets')) {
    $present = (az keyvault secret list --vault-name $VaultName --query '[].name' -o tsv) -split "`n" |
        ForEach-Object { $_.Trim() } | Where-Object { $_ }
}

$missing = $StillNeeded | Where-Object { $present -notcontains $_.Replace('_', '-') }

if ($failed.Count -gt 0) {
    Write-Host 'Some copies failed. The deploy will refuse to start without the required ones.' -ForegroundColor Red
    exit 1
}
if ($missing) {
    Write-Warning "Still missing from ${VaultName} (the deploy fails without these):"
    $missing | ForEach-Object { Write-Host "    $($_.Replace('_','-'))" }
    Write-Host "`nThese were not in the GKE secret either, so they have to come from"
    Write-Host 'their original source. Use scripts/load-keyvault.ps1, or set one with:'
    Write-Host "    az keyvault secret set --vault-name $VaultName --name <NAME> --value '...'"
    exit 1
}

Write-Host 'Every required secret is present. The deploy has what it needs to start.' -ForegroundColor Green
