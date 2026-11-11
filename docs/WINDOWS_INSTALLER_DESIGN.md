# Windows Installer Design – Medilink HMIS Desktop

## Branding
- **Product name:** Medilink HMIS Desktop
- **Primary colour:** Medilink blue (`#0066CC`)
- **Secondary colour:** Turquoise/Teal (`#00B5B5`)
- **Logo:** `src-tauri/installer/medilink-header.bmp`
- **Icon:** `src-tauri/icons/icon.ico`

## Screens
| Screen | Content | NSIS file |
|--------|---------|-----------|
| Welcome | Medilink logo, version, short description, **Continue / Cancel** | `installer/welcome.nsh` |
| License | Full license text, **I accept** checkbox (required) | `installer/license.nsh` |
| Options | Install folder picker, Desktop & Start‑Menu shortcut checkboxes | `installer/options.nsh` |
| Progress | Standard NSIS progress bar with Medilink branding | (built‑in) |
| Finish | Success message, **Launch now** checkbox, **Finish** button | `installer/finish.nsh` |

## Upgrade / Uninstall Behaviour
- Detect existing installation via registry key `HKCU\Software\Medilink HMIS`.
- Preserve `%APPDATA%\MedilinkHMIS` (cached clinical data) on upgrade/uninstall.
- Shortcuts are recreated only if the user selected them during the latest install.

## Files
- `src-tauri/installer/medilink-header.bmp`
- `src-tauri/installer/medilink-sidebar.bmp`
- `src-tauri/installer/medilink-hooks.nsh` (includes custom pages)
- `src-tauri/installer/*.nsh` (welcome, license, options, finish)
- `src-tauri/installer/LICENSE.txt` (real license file)

