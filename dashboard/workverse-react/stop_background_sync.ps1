$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateRoot = Join-Path $AppRoot ".runtime"
$PidFile = Join-Path $StateRoot "sync.pid"

if (-not (Test-Path $PidFile)) {
  Write-Output "No sync PID file found"
  exit 0
}

$pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue
if ($pidValue) {
  $process = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
  if ($process) {
    Stop-Process -Id $pidValue -Force
    Write-Output "Stopped background sync PID $pidValue"
  }
}

Remove-Item $PidFile -ErrorAction SilentlyContinue
