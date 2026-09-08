import '../prisma-env';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL_V2 ||
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'postgresql://postgres:postgres@localhost:5432/sufal_physics_forum');

if (!connectionString) {
  throw new Error(
    'DATABASE_URL_V2 is not set. Configure it in the GoDaddy/Airo environment variables.'
  );
}

function buildPoolConfig(rawUrl: string): { connectionString: string; ssl?: { rejectUnauthorized: boolean } } {
  const isLocalhost = /localhost|127\.0\.0\.1/.test(rawUrl);
  if (isLocalhost) {
    return { connectionString: rawUrl };
  }

  let normalized = rawUrl;
  try {
    const parsed = new URL(rawUrl.replace(/^postgres:\/\//, 'postgresql://'));
    const isPooler = parsed.port === '6543' || parsed.hostname.includes('pooler');
    if (!parsed.searchParams.has('sslmode')) {
      parsed.searchParams.set('sslmode', 'require');
    }
    if (isPooler && !parsed.searchParams.has('pgbouncer')) {
      parsed.searchParams.set('pgbouncer', 'true');
    }
    normalized = parsed.toString();
  } catch {
    normalized = rawUrl;
  }

  return {
    connectionString: normalized,
    ssl: { rejectUnauthorized: false },
  };
}

const pool = new Pool(buildPoolConfig(connectionString));

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
