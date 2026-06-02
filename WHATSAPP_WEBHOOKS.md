# WhatsApp Webhooks

## Evolution webhook endpoint

```
POST /api/webhooks/evolution
GET  /api/webhooks/evolution  (health check)
```

## Security

Set `EVOLUTION_WEBHOOK_SECRET` in `.env`. Requests must include:

- Header: `x-webhook-secret: YOUR_SECRET`, or
- Query: `?secret=YOUR_SECRET`

## Events handled

- `CONNECTION_UPDATE` — updates instance status in database
- `MESSAGES_UPSERT` — inbound text → AI reply pipeline
- `MESSAGES_UPDATE` — delivery/read status (stored in webhook log)
- Duplicate events ignored via SHA-256 idempotency key

## Inbound pipeline

```
Webhook → WhatsAppWebhookService → Lead/conversation lookup
       → Unsubscribe keywords (STOP, UNSUBSCRIBE, …)
       → RealEstateChatService (processChatMessage)
       → Evolution sendText reply
       → Store WhatsAppMessage records
```

## Unsubscribe

Keywords: `STOP`, `UNSUBSCRIBE`, `REMOVE ME`, `OPT OUT`, `NO MORE MESSAGES`

Confirmation message sent automatically. Lead `whatsappUnsubscribed` set to `true`.

## Local testing

Use ngrok or similar to expose `localhost:3000` and set `EVOLUTION_WEBHOOK_URL` to the public URL.

Simulate inbound (legacy): `POST /api/whatsapp/inbound`
