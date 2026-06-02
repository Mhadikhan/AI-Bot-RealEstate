# Migration to Meta WhatsApp Cloud API

PropertyConnect uses a provider abstraction. Switch without rewriting business logic:

```env
WHATSAPP_PROVIDER=meta
WHATSAPP_ENABLED=true
```

## Required Meta credentials

```env
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_BUSINESS_ACCOUNT_ID=
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_WEBHOOK_VERIFY_TOKEN=
META_FACEBOOK_APP_SECRET=
```

Legacy names still supported: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, etc.

## Differences

| Feature | Evolution (Baileys) | Meta Cloud |
|---------|---------------------|------------|
| Pairing | QR code | Business verification |
| Cold outreach | Session messages | Approved templates |
| Media | URL or base64 | Public HTTPS URLs |
| Scale | Limited (Web) | Production-grade |

## Steps

1. Create Meta Business app with WhatsApp product
2. Verify business and phone number
3. Create message templates for outbound campaigns
4. Set webhook URL to `/api/whatsapp/webhook`
5. Change `WHATSAPP_PROVIDER=meta` and restart

Provider implementation: `lib/whatsapp/meta-cloud.provider.ts`
