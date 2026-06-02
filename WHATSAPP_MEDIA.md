# WhatsApp Media

## Supported types

| Type | Formats | Max size (default) |
|------|---------|-------------------|
| Images | JPG, JPEG, PNG, WEBP | 100 MB |
| Videos | MP4 | 100 MB (campaign upload limits may differ) |
| Brochures / floor plans | PDF, PNG, JPG | 100 MB |

Configure: `WHATSAPP_MEDIA_MAX_BYTES=104857600`

## Property media

Upload via **Admin → Properties → edit listing → media tabs** or API:

```
POST /api/properties/{id}/media
Form: file, type (IMAGE|VIDEO|BROCHURE|FLOOR_PLAN), isPrimary
```

## Sending via Evolution API

Services in `lib/whatsapp/whatsapp-media.service.ts`:

- `sendPropertyCoverImage()` — one cover per property with caption
- `sendPropertyGallery()` — up to 5 images when customer requests more
- `sendPropertyVideo()`, `sendPropertyBrochure()`, `sendFloorPlan()`

API routes:

```
POST /api/whatsapp/send/image
POST /api/whatsapp/send/video
POST /api/whatsapp/send/document
POST /api/whatsapp/send/property-gallery
```

## Storage

Development: `STORAGE_PROVIDER=local` → `public/uploads/properties/`

Production: implement Cloudinary / S3 / R2 in `lib/storage/storage-provider.ts`.

## Test procedure

1. Connect Evolution API (see `EVOLUTION_API_SETUP.md`)
2. Upload property image in admin
3. Send test from Admin → WhatsApp Campaigns or Settings
4. Confirm message in WhatsApp on test phone
