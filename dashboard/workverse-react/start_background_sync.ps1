$AppRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$StateRoot = Join-Path $AppRoot ".runtime"
$PidFile = Join-Path $StateRoot "sync.pid"
$OutLog = Join-Path $StateRoot "sync.out.log"
$ErrLog = Join-Path $StateRoot "sync.err.log"

New-Item -ItemType Directory -Force -Path $StateRoot | Out-Null

if (Test-Path $PidFile) {
  $existingPid = Get-Content $PidFile -ErrorAction SilentlyContinue
  if ($existingPid) {
    $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($existingProcess) {
      Write-Output "Background sync already running with PID $existingPid"
      exit 0
    }
  }
}

$process = Start-Process `
  -FilePath python.exe `
  -ArgumentList "sync_runtime.py", "--watch", "--interval", "2" `
  -WorkingDirectory $AppRoot `
  -RedirectStandardOutput $OutLog `
  -RedirectStandardError $ErrLog `
  -WindowStyle Hidden `
  -PassThru

Set-Content -Path $PidFile -Value $process.Id
Write-Output "Started background sync with PID $($process.Id)"
