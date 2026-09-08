import '../prisma-env';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { logFullError } from './error-log';

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

pool.on('error', (error) => {
  logFullError(error, 'pg.Pool idle client');
});

function logPgError(source: string, error: unknown): never {
  logFullError(error, source);
  throw error;
}

const originalQuery = pool.query.bind(pool) as (...args: unknown[]) => unknown;
pool.query = ((...args: unknown[]) => {
  const result = originalQuery(...args);
  if (result && typeof result === 'object' && 'catch' in result) {
    return (result as Promise<unknown>).catch((error: unknown) =>
      logPgError('pg.Pool.query original error before Prisma wrap', error)
    );
  }
  return result;
}) as typeof pool.query;

const originalConnect = pool.connect.bind(pool) as (...args: unknown[]) => unknown;
pool.connect = ((...args: unknown[]) => {
  const result = originalConnect(...args);
  if (typeof args[0] === 'function') {
    return result;
  }
  return (result as Promise<unknown>).catch((error: unknown) =>
    logPgError('pg.Pool.connect original error before Prisma wrap', error)
  );
}) as typeof pool.connect;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const adapter = new PrismaPg(pool, {
  onPoolError: (error) => {
    logFullError(error, 'prisma-pg onPoolError (original pg error before wrap)');
  },
  onConnectionError: (error) => {
    logFullError(error, 'prisma-pg onConnectionError (original pg error before wrap)');
  },
});

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
