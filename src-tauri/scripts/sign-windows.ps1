# -------------------------------------------------
# sign-windows.ps1 – Authenticode signing for Tauri binaries
# -------------------------------------------------
param(
    [Parameter(Mandatory=$true)][string]$binaryPath   # %1 from Tauri config
)

# 1. Decode the base64‑encoded PFX from the secret
$certBase64 = $env:WINDOWS_CERTIFICATE_BASE64
if (-not $certBase64) {
    Write-Error "WINDOWS_CERTIFICATE_BASE64 not set"
    exit 1
}
$pfxPath = "$env:TEMP\medilink_cert.pfx"
[IO.File]::WriteAllBytes($pfxPath, [Convert]::FromBase64String($certBase64))

# 2. Get the password (may be empty for a password‑less cert)
$password = $env:WINDOWS_CERTIFICATE_PASSWORD
if (-not $password) { $password = "" }

# 3. Timestamp server (Microsoft’s recommended)
$timestampSrv = "http://timestamp.digicert.com"

# 4. Sign the executable (and optionally the installer)
#    Using SHA‑256 and embed the timestamp
& "signtool.exe" sign `
    /fd SHA256 `
    /f $pfxPath `
    /p $password `
    /t $timestampSrv `
    "$binaryPath"

# 5. Verify the signature
& "signtool.exe" verify /pa "$binaryPath"

# Clean up
Remove-Item $pfxPath

