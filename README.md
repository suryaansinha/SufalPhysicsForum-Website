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

The server runs on `http://localhost:3001`.

### 3. Set Up the Client

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and proxies `/api` requests to the server.

## API Endpoints

| Method | Path         | Description    |
|--------|--------------|----------------|
| GET    | `/api/health`| Health check   |
