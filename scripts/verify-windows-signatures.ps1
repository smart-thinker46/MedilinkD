param(
  [Parameter(Mandatory = $true)]
  [string]$ArtifactDirectory
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $ArtifactDirectory)) {
  throw "Artifact directory was not found: $ArtifactDirectory"
}

$signTool = Get-Command signtool.exe -ErrorAction SilentlyContinue
if (-not $signTool) {
  throw "signtool.exe was not found. Install the Windows SDK signing tools on the release runner."
}

$artifacts = Get-ChildItem -LiteralPath $ArtifactDirectory -Recurse -File -Include *.exe,*.msi
if ($artifacts.Count -eq 0) {
  throw "No Windows executable artifacts were found to verify."
}

foreach ($artifact in $artifacts) {
  & $signTool.Source verify /pa /v $artifact.FullName
  if ($LASTEXITCODE -ne 0) {
    throw "Authenticode verification failed for $($artifact.FullName)."
  }
}
