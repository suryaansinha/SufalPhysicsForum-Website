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
