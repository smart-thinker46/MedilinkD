param(
  [Parameter(Mandatory = $true)]
  [string]$TargetPath
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $TargetPath)) {
  throw "Signing target was not found: $TargetPath"
}

foreach ($name in @("WINDOWS_CERTIFICATE_PATH", "WINDOWS_CERTIFICATE_PASSWORD", "WINDOWS_TIMESTAMP_URL")) {
  if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
    throw "Required release signing environment variable $name is missing."
  }
}

$signTool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (-not $signTool) {
  throw "signtool.exe was not found. Install the Windows SDK signing tools on the release runner."
}

& $signTool.Source sign `
  /fd SHA256 `
  /f $env:WINDOWS_CERTIFICATE_PATH `
  /p $env:WINDOWS_CERTIFICATE_PASSWORD `
  /tr $env:WINDOWS_TIMESTAMP_URL `
  /td SHA256 `
  $TargetPath

if ($LASTEXITCODE -ne 0) {
  throw "Authenticode signing failed for $TargetPath."
}
