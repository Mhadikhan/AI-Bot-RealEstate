# WhatsApp Campaigns

## Admin UI

**Admin → WhatsApp Campaigns** — create broadcasts with text, image, or video.

## Opt-in rules

Messages only sent when:

```
whatsappOptIn = true
AND whatsappUnsubscribed = false
AND phone is not empty
```

## Campaign modes

| Mode | When |
|------|------|
| DEMO / SIMULATED | `WHATSAPP_ENABLED=false` or missing Evolution credentials |
| LIVE | Evolution API connected |

## Queue batching

Configured in `.env`:

```env
WHATSAPP_BATCH_SIZE=25
WHATSAPP_BATCH_DELAY_MS=3000
WHATSAPP_MAX_RETRIES=3
WHATSAPP_FAILURE_PAUSE_PERCENT=10
```

Implementation: `lib/whatsapp/whatsapp-queue.service.ts` — processes recipients in batches with delays and failure-rate pause.

## Campaign types (UI)

New listing, rental alert, brochure, viewing reminder, cold lead reactivation, custom.

## Stats

Tracked on `Broadcast` model: sent, failed, delivered, read, reply counts.

## Compliance

- Never broadcast to unsubscribed leads
- Include opt-out instructions in marketing copy
- Use separate test number for development
