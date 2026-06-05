@echo off
title PropertyConnect - Start Evolution API
set "DOCKER=C:\Program Files\Docker\Docker\resources\bin"
set "PATH=%DOCKER%;%PATH%"

cd /d "%~dp0"

echo.
echo Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker is not running.
    echo 1. Open "Docker Desktop" from Start menu
    echo 2. Wait until it says "Docker Desktop is running"
    echo 3. Run this file again
    echo.
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    pause
    exit /b 1
)

echo.
echo Starting Evolution API stack...
docker compose -f docker-compose.evolution.yml up -d
if errorlevel 1 (
    echo.
    echo Compose failed. Try pulling images first:
    echo   docker pull redis:7-alpine
    echo   docker pull postgres:16-alpine
    echo   docker pull evoapicloud/evolution-api:v2.3.7
    echo   docker compose -f docker-compose.evolution.yml up -d
    pause
    exit /b 1
)

echo.
echo Waiting for Evolution API on port 8080...
timeout /t 15 /nobreak >nul

echo.
docker compose -f docker-compose.evolution.yml ps
echo.
echo Evolution API: http://127.0.0.1:8080
echo Next: run "npm run dev" and open http://localhost:3000/admin/settings/whatsapp
echo.
pause
