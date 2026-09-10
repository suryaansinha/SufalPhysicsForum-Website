# SufalPhysicsForum

An educational platform for managing physics classes, students, attendance, fees, assignments, and online learning.

## Project Structure

```
.
├── client/             # React (Vite) + TypeScript + Tailwind CSS
├── server/             # Express + TypeScript + Prisma
└── docker-compose.yml  # PostgreSQL database
```

## Prerequisites

- Node.js >= 18
- Docker & Docker Compose

## Getting Started

### 1. Start PostgreSQL

```bash
docker compose up -d
```

### 2. Set Up the Server

```bash
cd server
cp .env.example .env      # Configure environment variables if needed
npm install
npx prisma generate
npx prisma db push        # Push schema to database
npm run dev
```

The server runs on `http://localhost:5000`.

### 3. Set Up the Client

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api` requests to the server.

## Production (GoDaddy / Airo)

GoDaddy injects MySQL credentials when the hosted database is attached:

- `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`

Also set these as persistent runtime env vars (not only on the build command):

- `PRISMA_HOME=/tmp/prisma-home` — Prisma home/cache (required on read-only hosts)
- `XDG_CACHE_HOME=/tmp/prisma-cache` — XDG cache used by Prisma engines
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- `CLIENT_URL` — your public site origin
- `GOOGLE_CLIENT_ID` — if using Google sign-in

`postbuild` runs `prisma migrate deploy` against the MySQL URL built from `DB_*`.

Seed a teacher account after the first deploy (from a host that can reach the same MySQL instance):

```bash
cd server
npx prisma db seed
```

Default seed login: `teacher@sufal.com` / `Password123!`

## API Endpoints

| Method | Path         | Description    |
|--------|--------------|----------------|
| GET    | `/api/health`| Health check   |
