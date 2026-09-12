import mariadb from 'mariadb';
import { logFullError } from './error-log';
import { jsonSafe } from './json-safe';
import { logMariadbConfigComparison, MYSQL_CONNECT_TIMEOUT_MS } from './mysql-url';

export type MariadbConnDiagResult = {
  ok: boolean;
  elapsedMs: number;
  connectMs?: number;
  queryMs?: number;
  config?: {
    host: string;
    port: number;
    user: string;
    database: string;
    connectTimeout: number;
    ssl: false;
    passwordPresent: boolean;
  };
  result?: unknown;
  error?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  fatal?: boolean;
};

export async function probeMariadbCreateConnection(): Promise<MariadbConnDiagResult> {
  const startedAt = Date.now();
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || '3306');

  if (!host || !user || !password || !database) {
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: 'Missing required env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME',
    };
  }

  const config = {
    host,
    port,
    user,
    database,
    connectTimeout: MYSQL_CONNECT_TIMEOUT_MS,
    ssl: false as const,
    passwordPresent: true,
  };

  logMariadbConfigComparison('GET /api/diag/mariadb-raw');
  console.log('GET /api/diag/mariadb-raw createConnection config', config);

  let conn: mariadb.Connection | undefined;
  try {
    const connectStartedAt = Date.now();
    conn = await mariadb.createConnection({
      host,
      port,
      user,
      password,
      database,
      connectTimeout: MYSQL_CONNECT_TIMEOUT_MS,
      ssl: false,
    });
    const connectMs = Date.now() - connectStartedAt;

    const queryStartedAt = Date.now();
    const rows = await conn.query('SELECT 1 AS ok');
    const queryMs = Date.now() - queryStartedAt;

    console.log('GET /api/diag/mariadb-conn ok', { connectMs, queryMs });

    return {
      ok: true,
      elapsedMs: Date.now() - startedAt,
      connectMs,
      queryMs,
      config,
      result: jsonSafe(rows),
    };
  } catch (error) {
    logFullError(error, 'diag.mariadb-conn createConnection');
    const err = error as Error & {
      code?: string;
      errno?: number;
      sqlState?: string;
      fatal?: boolean;
    };
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      connectMs: Date.now() - startedAt,
      config,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      fatal: err.fatal,
    };
  } finally {
    if (conn) {
      try {
        await conn.end();
      } catch (error) {
        console.error('diag.mariadb-conn connection.end failed', error);
      }
    }
  }
}
