# Deployment Guide

## Railway

1. Push this project to a private GitHub repository.
2. Create a Railway project.
3. Add a PostgreSQL service.
4. Add an application service from the GitHub repository.
5. Add environment variables from `.env.example`.
6. Use the PostgreSQL reference variable as `DATABASE_URL`.
7. Run the following before the first launch:

```bash
npx prisma migrate deploy
npm run db:seed
```

8. Use this start command:

```bash
npm run start
```

9. Generate a Railway public domain.
10. Verify:
   - `/`
   - `/admin`
   - `/api/properties`
   - `/api/leads`
   - `/api/bookings`

## Vercel

1. Create a managed PostgreSQL database.
2. Add `DATABASE_URL` and the remaining environment variables in Vercel.
3. Deploy the Next.js repository.
4. Run Prisma migrations from CI or a secure terminal:

```bash
npx prisma migrate deploy
npm run db:seed
```

## Custom Domain

Connect a subdomain such as:

```text
propertybot.yourdomain.com
```

Add the DNS record shown by the hosting provider, then confirm HTTPS is active.

## Important

Do not expose real API keys in client-side variables. Replace temporary admin credentials immediately.
