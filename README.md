# PropertyConnect AI

Deploy-ready MVP for a Pakistan real-estate AI lead-generation bot.

## Included

- Next.js application
- Floating website chatbot
- Rule-based chatbot fallback
- PostgreSQL database schema
- Prisma migrations and seed support
- Property inventory API
- Lead API with automatic score calculation
- Viewing-booking API
- FAQ fallback
- Basic admin CRM dashboard
- Railway/Vercel deployment notes

## Local Setup

### 1. Database (Neon — recommended)

1. Create a free project at [neon.tech](https://neon.tech).
2. In the Neon dashboard, open **Connect** and copy:
   - **Pooled connection** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`
3. Paste both into `.env` (see `.env.example`).

Or run the Neon CLI from this folder (opens a browser login, then writes `.env` for you):

```bash
npx neonctl auth
npx neonctl init --agent cursor
```

### 2. App

```bash
cp .env.example .env   # skip if neonctl init already created .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open:

- Website: `http://localhost:3000`
- Admin CRM: `http://localhost:3000/admin`

## Production Notes

This package is a deploy-ready MVP foundation. Before production use:

1. Add secure admin authentication middleware.
2. Replace sample property records.
3. Connect your OpenAI-compatible server-side provider.
4. Add WhatsApp Business API credentials.
5. Add rate limiting and production logging.
6. Connect the real domain and SSL.
7. Run full QA in your target hosting environment.

See `DEPLOYMENT.md` and `TESTING.md`.
