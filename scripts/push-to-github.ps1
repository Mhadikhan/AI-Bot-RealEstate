# Push PropertyConnect to GitHub (run in PowerShell)
$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $RepoRoot

$RemoteUrl = "git@github.com:Mhadikhan/AI-Bot-RealEstate.git"
$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_github"

Write-Host ""
Write-Host "=== PropertyConnect GitHub push ===" -ForegroundColor Cyan

$env:GIT_SSH_COMMAND = "ssh -i `"$KeyPath`" -o IdentitiesOnly=yes"

Write-Host ""
Write-Host "Testing GitHub SSH..." -ForegroundColor Yellow
$test = ssh -i $KeyPath -o IdentitiesOnly=yes -T git@github.com 2>&1 | Out-String
Write-Host $test
if ($test -notmatch "Hi Mhadikhan") {
    Write-Host ""
    Write-Host "SSH failed. Add this key at https://github.com/settings/keys" -ForegroundColor Red
    Get-Content "$KeyPath.pub"
    Write-Host ""
    Write-Host "Fingerprint:" -ForegroundColor Yellow
    ssh-keygen -lf "$KeyPath.pub"
    exit 1
}

git remote set-url origin $RemoteUrl
Write-Host ""
Write-Host "Remote: $RemoteUrl" -ForegroundColor Green
Write-Host ""
Write-Host "Pushing main..." -ForegroundColor Yellow
git push --force-with-lease origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Success: https://github.com/Mhadikhan/AI-Bot-RealEstate" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push failed. Try HTTPS with a Personal Access Token." -ForegroundColor Red
    exit $LASTEXITCODE
}
