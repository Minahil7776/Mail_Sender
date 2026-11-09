# DispatchMail

## Run
**Server** (`/server`): `cp .env.example .env`, fill in values, `npm install`, `npm run dev`
**Client** (`/client`): `cp .env.local.example .env.local`, `npm install`, `npm run dev` -> http://localhost:3000

Super admin is auto-created from SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD on first start.
Free MongoDB: MongoDB Atlas M0. Free hosting: Render/Railway (API), Vercel (frontend).
Sending speed = BATCH mails every INTERVAL_MS. Keep it under your SMTP provider's limits.
