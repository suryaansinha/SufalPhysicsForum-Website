import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'postgresql://postgres:postgres@localhost:5432/sufal_physics_forum');

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Configure it in the GoDaddy/Airo environment variables.'
  );
}

const isLocalhost = /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
});

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
