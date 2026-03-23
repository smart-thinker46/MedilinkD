# Medilink HMIS Desktop (Tauri)

## Local Dev

From `hmis-platform/apps/desktop`:

```bash
npm install
npm run tauri dev
```

If you hit weird Rust/Tauri build cache issues, clean and retry:

```bash
npm run tauri:clean
npm run tauri dev
```

## Build Installers

```bash
npm install
npm run tauri build
```

Artifacts will be under `src-tauri/target/release/bundle/`.

## Auto-Updates (GitHub Releases)

This desktop app is configured to check GitHub Releases for updates and show an in-app update banner in production builds.

### 1) Generate updater signing keys

Run inside `hmis-platform/apps/desktop`:

```bash
npx tauri signer generate
```

### 2) Set the updater public key in the app config

Edit `src-tauri/tauri.conf.json`:

- `plugins.updater.pubkey`: paste the **public** key

### 3) Add GitHub Secrets for signing

In the GitHub repo settings, add:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

### 4) Publish a release to trigger updates

1. Bump version in:
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`
   - `package.json` (recommended)
2. Commit + push, then tag and push:

```bash
git tag v0.1.1
git push origin v0.1.1
```

GitHub Actions (`.github/workflows/release.yml`) will build for Windows/macOS/Linux and publish a GitHub Release (including `latest.json`).

Notes:
- Desktop apps do not update on "every code change" automatically. Users get updates when you publish a new version/release.
- The updater endpoint is `releases/latest/download/latest.json`, so each new release becomes the next update.

