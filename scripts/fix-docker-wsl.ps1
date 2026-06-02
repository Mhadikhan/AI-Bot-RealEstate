# Run as Administrator: Right-click PowerShell → Run as administrator
#   cd to project folder
#   .\scripts\fix-docker-wsl.ps1

$ErrorActionPreference = "Stop"
Write-Host "=== PropertyConnect: Fix Docker + WSL2 ===" -ForegroundColor Cyan

$features = @(
    "VirtualMachinePlatform",
    "Microsoft-Windows-Subsystem-Linux",
    "Microsoft-Hyper-V-All"
)

foreach ($f in $features) {
    Write-Host "Enabling $f ..."
    try {
        Enable-WindowsOptionalFeature -Online -FeatureName $f -All -NoRestart | Out-Null
        Write-Host "  OK: $f" -ForegroundColor Green
    } catch {
        Write-Host "  Skip/failed: $f - $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`nSetting hypervisor launch type to auto..."
bcdedit /set hypervisorlaunchtype auto | Out-Null

Write-Host "Updating WSL..."
wsl --update

Write-Host "Installing WSL2 components (no distro yet)..."
wsl --install --no-distribution

Write-Host "`n=== DONE (reboot required) ===" -ForegroundColor Cyan
Write-Host "1. Restart your PC"
Write-Host "2. Open Docker Desktop (wait until Running)"
Write-Host "3. Run: docker ps"
Write-Host "4. Run: docker compose -f docker-compose.evolution.yml up -d"
Write-Host ""
Write-Host "If WSL still fails, enable Intel VT-x / AMD-V in BIOS:"
Write-Host "  https://aka.ms/enablevirtualization"
