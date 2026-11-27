import mariadb from 'mariadb';
import { logFullError } from './error-log';
import { jsonSafe } from './json-safe';
import {
  getMysqlPoolConfig,
  logMariadbConfigComparison,
  publicMariadbBarePoolConfig,
  publicMysqlPoolConfig,
} from './mysql-url';

export type MysqlPoolDiagResult = {
  ok: boolean;
  elapsedMs: number;
  getConnectionMs?: number;
  config?: ReturnType<typeof publicMysqlPoolConfig>;
  poolBefore?: {
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    taskQueueSize: number;
  };
  poolAfter?: {
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    taskQueueSize: number;
  };
  error?: string;
  code?: string;
  errno?: number;
  sqlState?: string;
  fatal?: boolean;
};

function poolSnapshot(pool: mariadb.Pool) {
  return {
    activeConnections: pool.activeConnections(),
    idleConnections: pool.idleConnections(),
    totalConnections: pool.totalConnections(),
    taskQueueSize: pool.taskQueueSize(),
  };
}

export async function probeMariadbPoolGetConnection(): Promise<MysqlPoolDiagResult> {
  const startedAt = Date.now();
  const config = getMysqlPoolConfig();
  if (!config) {
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      error: 'Missing required env vars: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME',
    };
  }

  const publicConfig = publicMysqlPoolConfig(config);
  const poolConfig = {
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: config.connectionLimit,
    minimumIdle: config.minimumIdle,
    idleTimeout: config.idleTimeout,
    connectTimeout: config.connectTimeout,
    acquireTimeout: config.acquireTimeout,
  };

  logMariadbConfigComparison('GET /api/diag/pool');
  console.log('GET /api/diag/pool createPool config', publicConfig);
  console.log('GET /api/diag/pool timeouts', {
    connectTimeout: poolConfig.connectTimeout,
    acquireTimeout: poolConfig.acquireTimeout,
    mariadbConnectTimeoutDefaultMs: 1000,
    mariadbAcquireTimeoutDefaultMs: 10000,
  });

  const pool = mariadb.createPool(poolConfig);
  (pool as mariadb.Pool & NodeJS.EventEmitter).on('error', (error: unknown) => {
    logFullError(error, 'diag.pool pool error event');
  });
  pool.on('connection', (conn) => {
    console.log('GET /api/diag/pool pool connection event');
    conn.on('error', (error) => {
      logFullError(error, 'diag.pool connection error event');
    });
  });

  let conn: mariadb.PoolConnection | undefined;
  let poolBefore;
  try {
    poolBefore = poolSnapshot(pool);
    console.log('GET /api/diag/pool before getConnection', poolBefore);

    const acquireStartedAt = Date.now();
    try {
      conn = await pool.getConnection();
    } catch (error) {
      logFullError(error, 'diag.pool getConnection');
      const err = error as Error & {
        code?: string;
        errno?: number;
        sqlState?: string;
        fatal?: boolean;
      };
      return {
        ok: false,
        elapsedMs: Date.now() - startedAt,
        getConnectionMs: Date.now() - acquireStartedAt,
        config: publicConfig,
        poolBefore,
        poolAfter: poolSnapshot(pool),
        error: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        fatal: err.fatal,
      };
    }

    const getConnectionMs = Date.now() - acquireStartedAt;
    const poolAfter = poolSnapshot(pool);
    console.log('GET /api/diag/pool getConnection ok', {
      getConnectionMs,
      poolAfter,
    });

    return {
      ok: true,
      elapsedMs: Date.now() - startedAt,
      getConnectionMs,
      config: publicConfig,
      poolBefore,
      poolAfter,
    };
  } catch (error) {
    logFullError(error, 'diag.pool unexpected');
    const err = error as Error & { code?: string; errno?: number; sqlState?: string; fatal?: boolean };
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      config: publicConfig,
      poolBefore,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      fatal: err.fatal,
    };
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (error) {
        console.error('diag.pool conn.release failed', error);
      }
    }
    try {
      await pool.end();
    } catch (error) {
      console.error('diag.pool pool.end failed', error);
    }
  }
}

export async function probeMariadbBarePoolGetConnection(): Promise<MysqlPoolDiagResult> {
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

  const publicConfig = publicMariadbBarePoolConfig();
  logMariadbConfigComparison('GET /api/diag/pool-bare');
  console.log('GET /api/diag/pool-bare createPool config', publicConfig);

  const pool = mariadb.createPool({
    host,
    port,
    user,
    password,
    database,
  });
  (pool as mariadb.Pool & NodeJS.EventEmitter).on('error', (error: unknown) => {
    logFullError(error, 'diag.pool-bare pool error event');
  });

  let conn: mariadb.PoolConnection | undefined;
  let poolBefore;
  try {
    poolBefore = poolSnapshot(pool);
    console.log('GET /api/diag/pool-bare before getConnection', poolBefore);

    const acquireStartedAt = Date.now();
    try {
      conn = await pool.getConnection();
    } catch (error) {
      logFullError(error, 'diag.pool-bare getConnection');
      const err = error as Error & {
        code?: string;
        errno?: number;
        sqlState?: string;
        fatal?: boolean;
      };
      return jsonSafe({
        ok: false,
        elapsedMs: Date.now() - startedAt,
        getConnectionMs: Date.now() - acquireStartedAt,
        config: publicConfig as MysqlPoolDiagResult['config'],
        poolBefore,
        poolAfter: poolSnapshot(pool),
        error: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        fatal: err.fatal,
      });
    }

    const getConnectionMs = Date.now() - acquireStartedAt;
    const poolAfter = poolSnapshot(pool);
    console.log('GET /api/diag/pool-bare getConnection ok', {
      getConnectionMs,
      poolAfter,
    });

    return jsonSafe({
      ok: true,
      elapsedMs: Date.now() - startedAt,
      getConnectionMs,
      config: publicConfig as MysqlPoolDiagResult['config'],
      poolBefore,
      poolAfter,
    });
  } catch (error) {
    logFullError(error, 'diag.pool-bare unexpected');
    const err = error as Error & { code?: string; errno?: number; sqlState?: string; fatal?: boolean };
    return jsonSafe({
      ok: false,
      elapsedMs: Date.now() - startedAt,
      config: publicConfig as MysqlPoolDiagResult['config'],
      poolBefore,
      error: err.message,
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      fatal: err.fatal,
    });
  } finally {
    if (conn) {
      try {
        await conn.release();
      } catch (error) {
        console.error('diag.pool-bare conn.release failed', error);
      }
    }
    try {
      await pool.end();
    } catch (error) {
      console.error('diag.pool-bare pool.end failed', error);
    }
  }
}
