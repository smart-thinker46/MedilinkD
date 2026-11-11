# Automatic Update System – Medilink HMIS Desktop

## Overview
This document describes the end‑to‑end automatic update flow for Medilink HMIS Desktop. It builds on the existing Tauri v2 updater infrastructure and adds:
- Periodic background checks
- Classification of updates (optional, recommended, mandatory)
- Snooze / remind‑later handling
- Network‑reconnection detection
- UI components (banner and Update Center)
- Secure download and minisign verification

## Architecture
1. **Updater service (`@tauri-apps/plugin-updater`)** – provides `check()` which fetches the update manifest from the GitHub‑hosted endpoint.
2. **`DesktopUpdater` React component** – runs on app start, schedules periodic checks, reacts to `online` events, parses classification from release notes, and stores user preferences (snooze) in `localStorage`.
3. **Update Center page** – a dedicated settings view that shows current version, latest version, release notes, status, and allows manual checks and download.
4. **Minisign verification** – performed automatically by the Tauri updater; the public key lives in `tauri.conf.json` (`plugins.updater.pubkey`).
5. **GitHub Actions** – builds the binary, creates minisign signatures, generates the `latest.json` manifest and publishes it alongside the installer.

## Update Classification
- **Optional** – default. Users may ignore or postpone.
- **Recommended** – appears with a stronger visual cue; user may snooze up to a configurable deadline.
- **Mandatory** – enforced after the configured enforcement window. The UI disables the "Remind later" button and forces an immediate install (unless a critical workflow is in progress).

Classification is inferred from the release notes using simple keyword tags (`[mandatory]`, `[recommended]`). Future releases can embed a JSON payload in the notes for more precise policies.

## User Experience Flow
1. **App start** → `DesktopUpdater` runs `checkForUpdates(false)`.
2. If an update is available, a banner appears with version, notes, and appropriate buttons.
3. Users can **Update now**, **Remind me later** (snoozes for 24 h), or **Close** for mandatory updates.
4. The **Update Center** (Settings → About → Software Updates) shows detailed status, history, and a manual "Check for updates" button.
5. When an update is downloaded, the updater verifies the minisign signature before installing. On success it relaunches the app.

## Security Guarantees
- All assets are fetched over HTTPS.
- Minisign public key is hard‑coded in the app; private signing keys never touch the client.
- The updater rejects any manifest or binary that fails verification.
- Mandatory updates cannot be bypassed; the UI prevents proceeding without installing.

## Failure Handling
- Network errors, signature failures, or insufficient disk space surface a clear error banner with a **Retry** button.
- The existing installed version remains operational; the installer never overwrites the current binary until verification passes.
- All errors are logged to the app’s internal logger for later diagnostics.

---
*For a full list of configuration options and API contracts, see the Tauri updater documentation.*
