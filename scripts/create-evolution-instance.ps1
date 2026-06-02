# Creates Evolution instance + configures webhook (run after Evolution API is up)
$apiKey = "c16990608b2035187e598b671301eacdaf2fadd759c8fd90"
$instance = "propertyconnect"
$headers = @{ apikey = $apiKey; "Content-Type" = "application/json" }

Write-Host "Creating instance $instance ..."
$body = @{
    instanceName = $instance
    qrcode = $true
    integration = "WHATSAPP-BAILEYS"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "http://localhost:8080/instance/create" -Method POST -Headers $headers -Body $body
} catch {
    Write-Host "Create (may already exist): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "Connection state:"
Invoke-RestMethod -Uri "http://localhost:8080/instance/connectionState/$instance" -Method GET -Headers $headers

Write-Host ""
Write-Host "QR code (open Admin UI for image, or check base64 below):"
$qr = Invoke-RestMethod -Uri "http://localhost:8080/instance/connect/$instance" -Method GET -Headers $headers
if ($qr.base64) { Write-Host "QR base64 received - use Admin -> Settings -> WhatsApp to display" }
else { $qr | ConvertTo-Json }

$webhookUrl = "http://host.docker.internal:3000/api/webhooks/evolution?secret=pcai_webhook_7f3a9b2e1d4c8e6f0a5b3d9c2e7f1a4b"
$wh = @{
    webhook = @{
        enabled = $true
        url = $webhookUrl
        byEvents = $false
        base64 = $false
        events = @("QRCODE_UPDATED","CONNECTION_UPDATE","MESSAGES_UPSERT","MESSAGES_UPDATE","SEND_MESSAGE")
    }
} | ConvertTo-Json -Depth 5

Write-Host "Setting webhook..."
Invoke-RestMethod -Uri "http://localhost:8080/webhook/set/$instance" -Method POST -Headers $headers -Body $wh
Write-Host "Done. Pair at http://localhost:3000/admin/settings/whatsapp" -ForegroundColor Green
