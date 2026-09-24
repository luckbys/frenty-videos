Unicode true
ManifestDPIAware true
SetCompressor /SOLID lzma
SetCompressorDictSize 64
!include "MUI2.nsh"

!define APPNAME "Frenty Vídeos"
!define EXE "FrentyVideos.exe"
!define VERSION "1.2.1"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\FrentyVideos"

Name "${APPNAME}"
OutFile "dist\FrentyVideos-Setup-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\Frenty Videos"
InstallDirRegKey HKCU "Software\FrentyVideos" "InstallDir"
RequestExecutionLevel user
BrandingText "Frenty"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "FileDescription" "Instalador do ${APPNAME}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "CompanyName" "Frenty"
VIAddVersionKey "LegalCopyright" "Frenty"

!define MUI_ICON "app\build\icon.ico"
!define MUI_UNICON "app\build\icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXE}"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir o ${APPNAME} agora"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "PortugueseBR"

Section "Instalar"
  ; Fecha uma versão aberta antes de atualizar os arquivos.
  nsExec::Exec 'taskkill /F /T /IM ${EXE}'
  Sleep 2000
  SetOutPath "$INSTDIR"
  RMDir /r "$INSTDIR\resources\app"
  File /r "dist\win-unpacked\*.*"
  WriteUninstaller "$INSTDIR\Desinstalar.exe"
  CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\${EXE}"
  CreateShortcut "$SMPROGRAMS\${APPNAME}.lnk" "$INSTDIR\${EXE}"
  ; Atalho para abrir sem aceleração de vídeo, se a janela ficar em branco em algum computador.
  CreateShortcut "$SMPROGRAMS\${APPNAME} (modo seguro).lnk" "$INSTDIR\${EXE}" "--sem-gpu"
  WriteRegStr HKCU "Software\FrentyVideos" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "Frenty"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${EXE}"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Desinstalar.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
SectionEnd

; Atualização automática: o app roda o instalador em modo silencioso (/S) e ele reabre o programa no fim.
Function .onInstSuccess
  IfSilent 0 +2
  Exec '"$INSTDIR\${EXE}"'
FunctionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /T /IM ${EXE}'
  Sleep 2000
  Delete "$DESKTOP\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME}.lnk"
  Delete "$SMPROGRAMS\${APPNAME} (modo seguro).lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\FrentyVideos"
  ; Os vídeos e marcas em Documentos\Frenty Vídeos são preservados.
SectionEnd
