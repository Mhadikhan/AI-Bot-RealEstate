# PropertyConnect — start Evolution API stack
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot + "\.."

if (-not (Test-Path ".env.evolution")) {
    Copy-Item ".env.evolution.example" ".env.evolution"
    Write-Host "Created .env.evolution from example. Edit AUTHENTICATION_API_KEY to match .env EVOLUTION_API_KEY."
}

docker compose -f docker-compose.evolution.yml up -d
Write-Host ""
Write-Host "Evolution API: http://localhost:8080"
Write-Host "Logs: docker compose -f docker-compose.evolution.yml logs -f evolution-api"
Write-Host ""
Write-Host "Next: npm run dev → Admin → Settings → WhatsApp → Create Instance → Generate QR"
