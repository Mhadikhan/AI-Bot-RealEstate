# WhatsApp Demo Mode

Demo Mode activates when:

```env
WHATSAPP_ENABLED=false
```

or when required credentials are missing:

- `EVOLUTION_API_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_API_INSTANCE_NAME`

## Behaviour

- Sends return status `SIMULATED`
- No `DELIVERED`, `READ`, or `CONNECTED` unless confirmed by real provider
- Campaign preview and test UI still work
- QR setup instructions shown in Admin → Settings → WhatsApp

## UI message

> WhatsApp is currently running in Demo Mode.
>
> To connect a WhatsApp test number, open Admin → Settings → WhatsApp, configure Evolution API, create an instance, and scan the QR code from WhatsApp → Linked Devices.

## Enable live mode

1. Start Evolution API Docker stack
2. Set all Evolution env vars
3. Set `WHATSAPP_ENABLED=true`
4. Restart app and scan QR
