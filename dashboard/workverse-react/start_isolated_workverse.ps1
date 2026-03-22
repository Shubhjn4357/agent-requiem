$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $AppRoot "..\\..")).Path

& (Join-Path $AppRoot "start_background_sync.ps1")
& python.exe (Join-Path $AppRoot "sync_runtime.py") --once | Out-Null

Set-Location $RepoRoot
npm run workverse:dev
