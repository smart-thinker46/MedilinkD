; Finish page for Medilink HMIS Desktop installer

!define MUI_PAGE_CUSTOMFUNCTION_SHOW FinishShow
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Function FinishShow
  ; Load the INI file that defines the UI
  !insertmacro MUI_INSTALLOPTIONS_EXTRACT "finish.ini"
  !insertmacro MUI_INSTALLOPTIONS_SHOW "finish.ini"
  ; Retrieve the launch‑now checkbox state
  !insertmacro MUI_INSTALLOPTIONS_GETCHECKED "finish.ini" "LaunchNow" $R0
  StrCpy $LAUNCH_AFTER_INSTALL $R0
FunctionEnd

