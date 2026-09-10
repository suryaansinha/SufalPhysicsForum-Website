export type MysqlPoolConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionLimit: number;
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
    connectionLimit: 5,
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
