# QA Checklist

## Public Bot

- Website loads on desktop and mobile
- Chatbot opens
- Buyer option responds
- Rental option responds
- Off-plan option responds
- Viewing option responds
- Human-agent option responds
- Unknown question uses safe fallback

## Database

- Prisma migration runs successfully
- Seed creates admin, agents, properties, FAQs, and demo lead
- `/api/properties` returns active listings
- `/api/leads` creates scored leads
- `/api/bookings` creates viewing records

## Admin CRM

- `/admin` displays metrics
- Recent leads display
- Active listing count is correct
- Viewing-booking count is correct

## Production

- Environment variables are configured
- Database is not reset during deployment
- HTTPS works
- Real API keys are server-side only
- Temporary credentials are changed
