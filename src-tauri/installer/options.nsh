; Options page for Medilink HMIS Desktop installer

!define MUI_PAGE_CUSTOMFUNCTION_PRE OptionsPre
!define MUI_PAGE_CUSTOMFUNCTION_SHOW OptionsShow
!insertmacro MUI_PAGE_CUSTOM OptionsPage

!insertmacro MUI_LANGUAGE "English"

Page custom OptionsPage OptionsPre OptionsShow

Function OptionsPre
  ; No pre‑logic needed now
FunctionEnd

Function OptionsShow
  ; Load the INI file that defines the UI
  !insertmacro MUI_INSTALLOPTIONS_EXTRACT "options.ini"
  !insertmacro MUI_INSTALLOPTIONS_SHOW "options.ini"
  ; Retrieve the user selections
  !insertmacro MUI_INSTALLOPTIONS_GETCHECKED "options.ini" "DesktopShortcut" $R0
  !insertmacro MUI_INSTALLOPTIONS_GETCHECKED "options.ini" "StartMenuShortcut" $R1
  ; Store the values in user variables for later use (e.g., in post‑install hooks)
  StrCpy $CREATE_DESKTOP_SHORTCUT $R0
  StrCpy $CREATE_STARTMENU_SHORTCUT $R1
FunctionEnd
