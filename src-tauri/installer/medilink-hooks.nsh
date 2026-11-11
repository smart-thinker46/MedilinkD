; Medilink HMIS Desktop NSIS lifecycle hooks.
; Tauri owns file deployment, registry values, shortcuts, upgrades, and removal.
; These intentionally avoid deleting AppData so an upgrade or uninstall does not
; discard locally cached clinical data or application preferences.

!macro NSIS_HOOK_PREINSTALL
  ; Keep the Tauri-managed upgrade path intact.
  !include "welcome.nsh"
  !include "license.nsh"
!macroend

!macro NSIS_HOOK_POSTINSTALL
  ; Tauri creates and updates Medilink Start Menu and Desktop shortcuts.
!include "options.nsh"
!macroend

!macro NSIS_HOOK_PREUNINSTALL
  ; User data is deliberately preserved by the standard Tauri uninstaller.
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ; No custom cleanup: preserve user data and do not affect permissions.
!macroend
