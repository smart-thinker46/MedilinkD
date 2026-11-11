; Welcome page for Medilink HMIS Desktop installer
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\win.bmp"
!insertmacro MUI_PAGE_WELCOME

; Custom text
!insertmacro MUI_LANGUAGE "English"
!define MUI_WELCOMEPAGE_TITLE "Welcome to Medilink HMIS Desktop"
!define MUI_WELCOMEPAGE_TEXT "\n\nMedilink HMIS Desktop helps you manage hospital information securely.\nVersion: ${VERSION}\n\nClick Next to continue."

