@echo off
title PaisaPilot AI - MCP Finance Copilot
echo ========================================================
echo         PaisaPilot AI - MCP Personal Finance Copilot
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Node.js environment...
node -v >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH. Please install Node.js v18+.
    pause
    exit /b 1
)

echo [2/3] Seeding demo database...
node server/database/seed.js

echo.
echo [3/3] Starting PaisaPilot Server on http://localhost:5000...
echo Both Express API and React Frontend are served from port 5000.
echo.
echo Open your browser at: http://localhost:5000
echo ========================================================
echo.

node server/server.js
pause
