@echo off
REM Start the AgriCon diagnosis API on 0.0.0.0:8000.
REM
REM Binding 0.0.0.0 (not 127.0.0.1) is what lets a phone reach this backend
REM over Wi-Fi: the Android app (built with Capacitor) has no dev-server
REM proxy, so it talks to this PC's LAN IP directly. In a browser tab
REM nothing changes -- the Vite dev server still proxies /api here same as
REM before, so start this BEFORE `npm run dev` either way.

cd /d "%~dp0"

REM Prefer the venv the main AgriCon project already uses (it has torch
REM installed); fall back to a local .venv, then to system python.
set PY=python
if exist "..\..\project\.venv\Scripts\python.exe" set PY=..\..\project\.venv\Scripts\python.exe
if exist ".venv\Scripts\python.exe" set PY=.venv\Scripts\python.exe

echo Using interpreter: %PY%
echo.
echo On a phone (AgriCon Android app), set "Backend address" to one of this
echo PC's IPv4 addresses below, with :8000 on the end, e.g. http://192.168.1.23:8000
echo   (skip 169.254.x.x addresses -- those aren't reachable from other devices)
ipconfig | findstr /c:"IPv4 Address"
echo.

"%PY%" -m uvicorn app:app --host 0.0.0.0 --port 8000
if errorlevel 1 (
  echo.
  echo Backend failed to start. If the error mentions a missing module, run:
  echo    %PY% -m pip install -r requirements.txt
  pause
)
