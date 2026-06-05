# Run in PowerShell (where "docker ps" works):
#   cd "c:\Users\Centric\Downloads\propertyconnect-ai-deploy-ready\propertyconnect-ai"
#   .\scripts\start-evolution-and-verify.ps1

$ErrorActionPreference = "Stop"
$dockerBin = "C:\Program Files\Docker\Docker\resources\bin"
if (Test-Path $dockerBin) { $env:Path = "$dockerBin;$env:Path" }
Set-Location $PSScriptRoot + "\.."

Write-Host "Starting Evolution API stack..." -ForegroundColor Cyan
docker compose -f docker-compose.evolution.yml up -d

Write-Host "Waiting for Evolution API (up to 90s)..." -ForegroundColor Cyan
$ready = $false
for ($i = 1; $i -le 18; $i++) {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8080" -TimeoutSec 5 -UseBasicParsing
        if ($r.StatusCode -ge 200) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 5
    Write-Host "  ...still starting ($i/18)"
}

if (-not $ready) {
    Write-Host "Evolution API not responding yet. Check logs:" -ForegroundColor Yellow
    Write-Host "  docker compose -f docker-compose.evolution.yml logs evolution-api"
    exit 1
}

Write-Host "Evolution API is up at http://localhost:8080" -ForegroundColor Green
docker compose -f docker-compose.evolution.yml ps

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. npm run dev"
Write-Host "  2. Open http://localhost:3000/admin/settings/whatsapp"
Write-Host "  3. Create Instance -> Generate QR Code -> scan with WhatsApp"
