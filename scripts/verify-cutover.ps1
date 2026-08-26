<#
.SYNOPSIS
    Prove the kanNINJA stack works on AKS BEFORE DNS is flipped to it.

.DESCRIPTION
    The dark deploy is the whole safety of this cutover: workloads run in the
    `kanninja` namespace on AKS while kanninja.com still resolves to GKE, so a
    broken deploy costs nothing. This script is what turns "the rollout
    succeeded" into "the stack actually serves requests", which are not the same
    claim and were previously indistinguishable.

    IT PROBES FROM INSIDE `sparx-prod`, NOT FROM THIS MACHINE. The public
    hostnames still point at GKE and the Services have no external address, so
    there is nothing to curl from here. More importantly, the path that has to
    work at cutover is Caddy → `<svc>.kanninja.svc.cluster.local`, cross
    namespace — so the probe runs from Caddy's own namespace and uses the exact
    addresses the Caddyfile does. A port-forward would prove something easier
    than the thing that has to be true.

.PARAMETER Namespace
    Where the workloads live. Defaults to kanninja.

.PARAMETER IngressNamespace
    Where the shared Caddy runs, and where the probe pod is created.
    Defaults to sparx-prod.

.EXAMPLE
    ./scripts/verify-cutover.ps1
#>
[CmdletBinding()]
param(
    [string]$Namespace = 'kanninja',
    [string]$IngressNamespace = 'sparx-prod'
)

$ErrorActionPreference = 'Stop'
$script:Failures = @()
$script:Warnings = @()

function Test-Step {
    param([string]$Name, [scriptblock]$Check)
    Write-Host -NoNewline "  $Name ... "
    try {
        $detail = & $Check
        Write-Host "ok" -ForegroundColor Green
        if ($detail) { Write-Host "      $detail" -ForegroundColor DarkGray }
    }
    catch {
        Write-Host "FAIL" -ForegroundColor Red
        Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
        $script:Failures += $Name
    }
}

function Warn($msg) {
    Write-Host "      ! $msg" -ForegroundColor Yellow
    $script:Warnings += $msg
}

# --- 0. right cluster -------------------------------------------------------
$ctx = (kubectl config current-context).Trim()
Write-Host "context: $ctx`n"
if ($ctx -notlike '*aks-sparx-prod*') {
    throw "kubectl is pointed at '$ctx', not the AKS production cluster. Run: az aks get-credentials -g rg-sparx-prod-cus -n aks-sparx-prod-cus"
}

Write-Host 'Workloads' -ForegroundColor Cyan

Test-Step 'namespace exists' {
    kubectl get ns $Namespace *> $null
    if ($LASTEXITCODE -ne 0) { throw "namespace '$Namespace' not found — has the deploy run?" }
}

foreach ($d in @('backend', 'frontend', 'mcp')) {
    Test-Step "deploy/$d available" {
        $json = kubectl get deploy $d -n $Namespace -o json 2>$null
        if ($LASTEXITCODE -ne 0) { throw "not found" }
        $o = $json | ConvertFrom-Json
        $want = $o.spec.replicas
        $have = [int]$o.status.availableReplicas
        if ($have -lt $want) { throw "$have/$want replicas available" }
        "$have/$want replicas"
    }
}

# The single most likely first-deploy failure, and it does not look like what it
# is: GHCR creates a package PRIVATE, nothing in k8s/ carries an
# imagePullSecret, and the kubelet's 401 surfaces as a tag-looking error.
Test-Step 'no pods stuck pulling or crashing' {
    $pods = (kubectl get pods -n $Namespace -o json | ConvertFrom-Json).items
    $bad = foreach ($p in $pods) {
        foreach ($cs in @($p.status.containerStatuses)) {
            $r = $cs.state.waiting.reason
            if ($r -in @('ImagePullBackOff', 'ErrImagePull', 'CrashLoopBackOff', 'CreateContainerConfigError')) {
                "$($p.metadata.name): $r"
            }
        }
    }
    if ($bad) {
        if ($bad -match 'ImagePull') {
            Warn 'ImagePullBackOff usually means the GHCR packages are still PRIVATE. Make ghcr.io/brandonkorous/kanninja/{backend,frontend,mcp-remote} public.'
        }
        throw ($bad -join '; ')
    }
}

Write-Host "`nSecrets" -ForegroundColor Cyan
foreach ($s in @('backend-secrets', 'mcp-secrets', 'frontend-secrets')) {
    Test-Step "secret/$s" {
        $json = kubectl get secret $s -n $Namespace -o json 2>$null
        if ($LASTEXITCODE -ne 0) { throw 'missing — the deploy creates it from Key Vault' }
        # @(...).Count, not .PSObject.Properties.Count directly: the latter is
        # evaluated per-element by PowerShell's member enumeration and prints a
        # column of 1s instead of one total.
        $n = @(($json | ConvertFrom-Json).data.PSObject.Properties).Count
        "$n key(s)"
    }
}

# --- serving path -----------------------------------------------------------
Write-Host "`nServing path (probed from $IngressNamespace, as Caddy does)" -ForegroundColor Cyan

# One pod, several requests. Each line of output is "<label> <http_code>", which
# is parsed below — curl's --write-out is used rather than exit codes so a 503
# is distinguishable from a connection refusal.
$targets = @(
    @{ label = 'backend-live';  url = "http://backend.$Namespace.svc.cluster.local:80/api/health" }
    @{ label = 'backend-ready'; url = "http://backend.$Namespace.svc.cluster.local:80/api/health/ready" }
    @{ label = 'frontend';      url = "http://frontend.$Namespace.svc.cluster.local:80/" }
    @{ label = 'mcp';           url = "http://mcp.$Namespace.svc.cluster.local:80/health" }
)

# BASE64, because the script does not survive the trip otherwise.
#
# Passing this inline as `sh -c $curlScript` means the text crosses PowerShell's
# argument binder, kubectl's argv handling and finally sh -- and the semicolons,
# single quotes and % signs in it do not come out the other side intact. The
# symptom is not an error: the pod runs, prints nothing this script can parse,
# and every HTTP check reports an empty status while the services are perfectly
# healthy. Encoding sidesteps every layer of quoting; only base64's own
# alphabet has to survive, and it contains nothing any shell treats specially.
$curlScript = ($targets | ForEach-Object {
    "printf '%s ' $($_.label); curl -s -o /dev/null -m 10 -w '%{http_code}\n' '$($_.url)' || printf 'ERR\n'"
}) -join '; '

$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($curlScript))

Write-Host '  starting probe pod ...'
$raw = kubectl run "cutover-probe-$(Get-Random -Maximum 99999)" `
    -n $IngressNamespace --rm -i --restart=Never --quiet `
    --image=curlimages/curl:8.11.1 --command -- `
    sh -c "echo $b64 | base64 -d | sh" 2>&1

$codes = @{}
foreach ($line in ($raw -split "`n")) {
    if ($line -match '^\s*(\S+)\s+(\d{3}|ERR)\s*$') { $codes[$Matches[1]] = $Matches[2] }
}

if ($codes.Count -eq 0) {
    Write-Host '  probe pod produced no parseable output:' -ForegroundColor Red
    Write-Host $raw
    $script:Failures += 'probe pod'
}

Test-Step 'backend liveness (200)' {
    $c = $codes['backend-live']; if ($c -ne '200') { throw "got $c" }; 'process is up'
}

# The one that matters. This is the check that did not exist before the cutover
# work: it executes `select 1` against Azure Postgres as `kanninja_app`, so a 200
# proves the private DNS name resolves from inside the VNet, TLS negotiates, the
# role's password matches the vault, and the pool hands out a connection.
Test-Step 'backend readiness — REAL database check (200)' {
    $c = $codes['backend-ready']
    if ($c -eq '503') { throw 'database unreachable. Check: kubectl logs -n ' + $Namespace + ' deploy/backend | Select-String readiness' }
    if ($c -ne '200') { throw "got $c" }
    'select 1 against Azure Postgres succeeded'
}

Test-Step 'frontend renders (200)' {
    $c = $codes['frontend']; if ($c -ne '200') { throw "got $c" }
}

Test-Step 'mcp responds (200)' {
    $c = $codes['mcp']; if ($c -ne '200') { throw "got $c" }
}

# --- DNS --------------------------------------------------------------------
Write-Host "`nDNS" -ForegroundColor Cyan
Test-Step 'kanninja.com still points away from AKS (dark deploy intact)' {
    $ips = try { (Resolve-DnsName kanninja.com -Type A -ErrorAction Stop).IPAddress } catch { @() }
    # Cloudflare proxies these records, so the answer is a Cloudflare edge
    # address either way and cannot distinguish origin. This only catches the
    # unproxied case; it is a courtesy check, not a guarantee.
    if ($ips -contains '20.12.217.0') {
        Warn 'kanninja.com already resolves to the AKS ingress — DNS has been flipped. This is no longer a dark deploy.'
    }
    "resolves to: $($ips -join ', ')"
}

# --- verdict ----------------------------------------------------------------
Write-Host ''
if ($script:Failures.Count -eq 0) {
    Write-Host 'All checks passed.' -ForegroundColor Green
    Write-Host @"

The stack serves requests on AKS and reaches Azure Postgres. What this does NOT
prove, because it cannot before DNS moves:

  - TLS. Caddy issues a certificate on the FIRST HTTPS REQUEST to each hostname
    (on-demand), which cannot happen while the name resolves elsewhere.
  - Session cookies. They are scoped to .kanninja.com, so no sign-in flow is
    exercisable over a cluster-internal address.
  - Google OAuth. The callback URL is https://api.kanninja.com/api/auth/callback/google.

Those three are the first things to test AFTER the flip, in that order.
"@
}
else {
    Write-Host "$($script:Failures.Count) check(s) failed:" -ForegroundColor Red
    $script:Failures | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    Write-Host "`nDo not flip DNS." -ForegroundColor Red
    exit 1
}
