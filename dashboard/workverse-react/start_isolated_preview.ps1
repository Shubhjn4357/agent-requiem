$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $AppRoot "..\\..")).Path

& (Join-Path $AppRoot "start_background_sync.ps1")
Set-Location $RepoRoot
npm run workverse:build

Set-Location $AppRoot
& python.exe serve_dist.py
