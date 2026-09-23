@echo off
title Grind and Co. - Coffee Tale (dev server)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Please install Node.js from https://nodejs.org
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo [INFO] Installing dependencies for the first time...
  call npm install
)

rem Open the browser automatically once the server is really up.
start "GrindCoOpenBrowser" cmd /c "powershell -NoProfile -Command $i=0; while($i -lt 60){ if(Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue){ Start-Process 'http://localhost:3000'; exit }; Start-Sleep -Seconds 1; $i++ }"

echo =============================================
echo   Grind and Co. - Self-Order Coffee
echo   Server:  http://localhost:3000
echo   To stop the shop: close this window (Ctrl+C)
echo   Keep this window open while using the shop.
echo =============================================
echo Starting server...

call npm run dev -- -p 3000

echo.
if errorlevel 1 (
  echo [ERROR] Server stopped with an error, or port 3000 is already in use.
  echo         Close other Grind windows, then run start.bat again.
) else (
  echo Server stopped. The website is now offline.
)
echo.
pause