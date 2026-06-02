# Evolution API Setup

PropertyConnect AI uses Evolution API v2 (`evoapicloud/evolution-api:v2.3.7`) for WhatsApp Web pairing via QR code.

## 1. Start Docker stack

```bash
cp .env.evolution.example .env.evolution
# Edit AUTHENTICATION_API_KEY and POSTGRES password in .env.evolution

docker compose -f docker-compose.evolution.yml up -d
docker compose -f docker-compose.evolution.yml logs -f evolution-api
```

Verify: open http://localhost:8080

## 2. PropertyConnect `.env`

```env
WHATSAPP_PROVIDER=evolution
WHATSAPP_ENABLED=true
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=<same as AUTHENTICATION_API_KEY in .env.evolution>
EVOLUTION_API_INSTANCE_NAME=propertyconnect
EVOLUTION_WEBHOOK_SECRET=<long random string>
EVOLUTION_WEBHOOK_URL=http://localhost:3000/api/webhooks/evolution
```

Restart: `npm run dev`

## 3. Pair WhatsApp

1. Open **Admin → Settings → WhatsApp** (`/admin/settings/whatsapp`)
2. Click **Create Instance**
3. Click **Generate QR Code**
4. On your **test phone**: WhatsApp → Linked Devices → Link a Device → scan QR
5. Wait for status **CONNECTED**

## 4. Webhook

Webhooks are configured automatically when creating an instance. Production URL:

```
https://your-domain.com/api/webhooks/evolution?secret=YOUR_SECRET
```

## Common errors

| Error | Fix |
|-------|-----|
| 401 Unauthorized | `EVOLUTION_API_KEY` must match `AUTHENTICATION_API_KEY` |
| Connection refused | Start Docker stack, check port 8080 |
| QR expired | Click **Generate QR Code** again |
| Demo Mode in app | Set `WHATSAPP_ENABLED=true` and all Evolution vars |

## Restart

```bash
docker compose -f docker-compose.evolution.yml restart evolution-api
npm run dev
```
