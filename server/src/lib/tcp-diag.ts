import net from 'net';
import { logFullError } from './error-log';

export type TcpProbeResult = {
  ok: boolean;
  host: string;
  port: number;
  elapsedMs: number;
  error?: string;
};

function defaultPortForUrl(rawUrl: string): number {
  if (/^mysqls?:\/\//i.test(rawUrl)) {
    return 3306;
  }
  return 5432;
}

export function parseDatabaseTarget(rawUrl: string): { host: string; port: number } {
  const parsed = new URL(
    rawUrl
      .replace(/^postgres:\/\//i, 'postgresql://')
      .replace(/^mysql:\/\//i, 'http://')
      .replace(/^mysqls:\/\//i, 'https://')
  );
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : defaultPortForUrl(rawUrl),
  };
}

export function resolveMysqlProbeTarget(): { host: string; port: number } | null {
  const host = process.env.MYSQL_HOST?.trim();
  if (host) {
    const port = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
    return { host, port };
  }

  const url = process.env.DATABASE_URL_V2 || process.env.DATABASE_URL;
  if (!url) {
    return null;
  }

  try {
    return parseDatabaseTarget(url);
  } catch {
    return null;
  }
}

export function probeTcp(host: string, port: number, timeoutMs = 8000): Promise<TcpProbeResult> {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (payload: { ok: boolean; error?: string }) => {
      socket.destroy();
      resolve({
        host,
        port,
        elapsedMs: Date.now() - startedAt,
        ...payload,
      });
    };
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      console.log('TCP connect succeeded', { host, port });
      finish({ ok: true });
    });
    socket.on('timeout', () => {
      const error = new Error(`TCP timeout after ${timeoutMs}ms connecting to ${host}:${port}`);
      logFullError(error, 'diag.tcp timeout');
      finish({ ok: false, error: error.message });
    });
    socket.on('error', (error) => {
      console.error('TCP connect failed:', error);
      logFullError(error, 'diag.tcp');
      finish({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  });
}

export async function probeDatabaseTcp(rawUrl: string): Promise<TcpProbeResult> {
  const { host, port } = parseDatabaseTarget(rawUrl);
  return probeTcp(host, port);
}

export async function probeConfiguredDatabaseTcp(): Promise<TcpProbeResult | null> {
  const target = resolveMysqlProbeTarget();
  if (!target) {
    return null;
  }
  return probeTcp(target.host, target.port);
}
