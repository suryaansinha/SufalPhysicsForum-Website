export const MYSQL_CONNECT_TIMEOUT_MS = 5000;
export const MYSQL_ACQUIRE_TIMEOUT_MS = 10000;

export type MysqlPoolConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
  minimumIdle: number;
  idleTimeout: number;
  connectTimeout: number;
  acquireTimeout: number;
};

export type PublicMysqlPoolConfig = {
  host: string;
  port: number;
  user: string;
  database: string;
  connectionLimit: number;
  minimumIdle: number;
  idleTimeout: number;
  connectTimeout: number;
  acquireTimeout: number;
  passwordPresent: boolean;
};

export function getMysqlPoolConfig(): MysqlPoolConfig | null {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) {
    return null;
  }
  return {
    host,
    port: Number(process.env.DB_PORT || '3306'),
    user,
    password,
    database,
    connectionLimit: 1,
    minimumIdle: 0,
    idleTimeout: 1,
    connectTimeout: MYSQL_CONNECT_TIMEOUT_MS,
    acquireTimeout: MYSQL_ACQUIRE_TIMEOUT_MS,
  };
}

export function publicMariadbConnectionConfig(): {
  host: string;
  port: number;
  user: string;
  database: string;
  connectTimeout: number;
  ssl: false;
  passwordPresent: boolean;
} | null {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) {
    return null;
  }
  return {
    host,
    port: Number(process.env.DB_PORT || '3306'),
    user,
    database,
    connectTimeout: MYSQL_CONNECT_TIMEOUT_MS,
    ssl: false,
    passwordPresent: true,
  };
}

export function publicMariadbBarePoolConfig(): {
  host: string;
  port: number;
  user: string;
  database: string;
  passwordPresent: boolean;
} | null {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  if (!host || !user || !password || !database) {
    return null;
  }
  return {
    host,
    port: Number(process.env.DB_PORT || '3306'),
    user,
    database,
    passwordPresent: true,
  };
}

export function logMariadbConfigComparison(source: string): void {
  const connection = publicMariadbConnectionConfig();
  const pool = getMysqlPoolConfig();
  const poolPublic = pool ? publicMysqlPoolConfig(pool) : null;
  const barePool = publicMariadbBarePoolConfig();
  console.log(`${source} mariadb config comparison`, {
    createConnection: connection,
    createPoolCurrent: poolPublic,
    createPoolBare: barePool,
    poolOnlyKeysOnCurrent: poolPublic
      ? {
          connectionLimit: poolPublic.connectionLimit,
          minimumIdle: poolPublic.minimumIdle,
          idleTimeout: poolPublic.idleTimeout,
          connectTimeout: poolPublic.connectTimeout,
          acquireTimeout: poolPublic.acquireTimeout,
        }
      : null,
    unsetPoolOptionsUsingDriverDefaults: {
      resetAfterUse: 'unset',
      ssl: 'unset on pool (createConnection sets ssl: false)',
      trace: 'unset',
      multipleStatements: 'unset',
    },
  });
}

export function publicMysqlPoolConfig(config: MysqlPoolConfig): PublicMysqlPoolConfig {
  return {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database,
    connectionLimit: config.connectionLimit,
    minimumIdle: config.minimumIdle,
    idleTimeout: config.idleTimeout,
    connectTimeout: config.connectTimeout,
    acquireTimeout: config.acquireTimeout,
    passwordPresent: Boolean(config.password),
  };
}

export function buildMysqlDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const config = getMysqlPoolConfig();
  if (!config) {
    return undefined;
  }
  const user = encodeURIComponent(config.user);
  const password = encodeURIComponent(config.password);
  return `mysql://${user}:${password}@${config.host}:${config.port}/${config.database}`;
}
