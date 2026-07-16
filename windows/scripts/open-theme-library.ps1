[CmdletBinding()]
param(
  [int]$Port = 9335
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common-windows.ps1')

Assert-DreamSkinPort -Port $Port
$node = Get-DreamSkinNodeRuntime
$codex = Get-DreamSkinCodexInstall
$identity = Get-DreamSkinVerifiedCdpIdentity -Port $Port -Codex $codex
if ($null -eq $identity) {
  throw "No verified Codex CDP endpoint is available on 127.0.0.1:$Port. Start Codex with --remote-debugging-address=127.0.0.1 and --remote-debugging-port=$Port, then run this command again."
}

$injector = Join-Path $PSScriptRoot 'injector.mjs'
& $node.Path $injector --library --port $Port --browser-id $identity.BrowserId --timeout-ms 30000
if ($LASTEXITCODE -ne 0) {
  throw "Theme library injection failed with exit code $LASTEXITCODE."
}

Write-Host 'Theme library is ready in the lower-right corner of Codex.'
