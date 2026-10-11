@echo off
setlocal
cd /d "%~dp0"
where node >/dev/null 2>nul
if errorlevel 1 (
  echo This site needs Node.js to run. Free download: https://nodejs.org
  pause
  exit /b 1
)
node serve.mjs
pause
