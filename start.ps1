# PaisaPilot AI - One-Click Launcher for PowerShell
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "        PaisaPilot AI - MCP Personal Finance Copilot" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "[1/3] Checking Node.js environment..." -ForegroundColor Yellow
try {
    $nodeVer = & node -v
    Write-Host "Found Node.js: $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

Write-Host "[2/3] Seeding demo database..." -ForegroundColor Yellow
& node server/database/seed.js

Write-Host ""
Write-Host "[3/3] Starting PaisaPilot Server on http://localhost:5000..." -ForegroundColor Yellow
Write-Host "Express API and React Frontend are served from port 5000." -ForegroundColor Cyan
Write-Host "Open your browser at: http://localhost:5000" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

& node server/server.js
