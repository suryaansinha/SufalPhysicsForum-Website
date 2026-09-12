import '../prisma-env';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMysql2 } from './prisma-mysql2-adapter';
import { getMysqlPoolConfig, publicMysqlPoolConfig } from './mysql-url';

function createPrismaClient(): PrismaClient {
  const config = getMysqlPoolConfig();
  if (!config) {
    throw new Error(
      'MySQL env vars DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are required. GoDaddy injects these at runtime when the hosted database is attached.'
    );
  }

  const poolConfig = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    connectTimeout: config.connectTimeout,
    waitForConnections: true,
    enableKeepAlive: true,
  };

  console.log('PrismaMysql2 createPool driver', 'mysql2.createPool');
  console.log('PrismaMysql2 createPool config', {
    ...publicMysqlPoolConfig(config),
    waitForConnections: true,
    enableKeepAlive: true,
  });

  const adapter = new PrismaMysql2(poolConfig, config.database);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
