import mysql from 'mysql2/promise';

export type MysqlEnvPresence = {
  DB_HOST: boolean;
  DB_PORT: boolean;
  DB_USER: boolean;
  DB_PASSWORD: boolean;
  DB_NAME: boolean;
};

export type MysqlDiagResult = {
  ok: boolean;
  present: MysqlEnvPresence;
  missing: string[];
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  result?: unknown;
  error?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
};

const REQUIRED_KEYS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;

export function getMysqlEnvPresence(): MysqlEnvPresence {
  return {
    DB_HOST: Boolean(process.env.DB_HOST),
    DB_PORT: Boolean(process.env.DB_PORT),
    DB_USER: Boolean(process.env.DB_USER),
    DB_PASSWORD: Boolean(process.env.DB_PASSWORD),
    DB_NAME: Boolean(process.env.DB_NAME),
  };
}

export async function probeMysqlSelect1(): Promise<MysqlDiagResult> {
  const present = getMysqlEnvPresence();
  const missing = REQUIRED_KEYS.filter((key) => !process.env[key]);
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  if (missing.length > 0) {
    return {
      ok: false,
      present,
      missing,
      error: `Missing required env vars: ${missing.join(', ')}`,
    };
  }

  let connection: mysql.Connection | undefined;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
    });
    const [rows] = await connection.query('SELECT 1 AS ok');
    return {
      ok: true,
      present,
      missing,
      host,
      port,
      database,
      user,
      result: rows,
    };
  } catch (error) {
    const err = error as Error & { code?: string; errno?: number; sqlState?: string };
    return {
      ok: false,
      present,
      missing,
      host,
      port,
      database,
      user,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
    };
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
