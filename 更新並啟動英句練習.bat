@echo off
chcp 65001 >nul
setlocal

set "ENGLISHWEB_PROJECT_DIR=%~dp0"
set "ENGLISHWEB_LAUNCHER=%~dp0scripts\windows-launcher.ps1"
cd /d "%ENGLISHWEB_PROJECT_DIR%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$code = [IO.File]::ReadAllText($env:ENGLISHWEB_LAUNCHER, [Text.Encoding]::UTF8); & ([ScriptBlock]::Create($code)) -Mode 'Update' -ProjectDirectory $env:ENGLISHWEB_PROJECT_DIR"
set "ENGLISHWEB_EXIT_CODE=%ERRORLEVEL%"

if not "%ENGLISHWEB_EXIT_CODE%"=="0" (
  echo.
  pause
)

endlocal & exit /b %ENGLISHWEB_EXIT_CODE%
