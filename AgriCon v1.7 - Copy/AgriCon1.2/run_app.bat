@echo off
REM One-command launcher: builds the frontend, then starts the backend,
REM which now also serves that build. Result: a single process on a single
REM port doing everything -- no separate frontend server to keep open.
REM
REM   1. npm run build     (bundles src/ into dist/)
REM   2. backend\run_backend.bat   (starts the API; it now also serves dist/)
REM
REM Once it prints "Application startup complete", open:
REM   http://localhost:8000
REM or, from a phone on the same Wi-Fi, this PC's LAN IP (printed below)
REM with :8000 on the end.
REM
REM Changed frontend code since the last run? Just re-run this file -- it
REM rebuilds every time. For active development with hot-reload instead,
REM use the two-terminal workflow: backend\run_backend.bat  +  npm run dev

cd /d "%~dp0"

echo Building frontend (npm run build)...
call npm run build
if errorlevel 1 (
  echo.
  echo Frontend build failed -- see the errors above.
  pause
  exit /b 1
)

echo.
echo Starting AgriCon -- backend API + built frontend, one process, one port...
echo.
call backend\run_backend.bat
