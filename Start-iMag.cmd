@echo off
setlocal
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-iMag.ps1"
if errorlevel 1 (
  echo.
  echo Pornirea iMag a esuat. Citeste mesajul de mai sus.
  pause
)
endlocal
