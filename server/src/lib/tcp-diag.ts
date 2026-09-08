import net from 'net';
import { logFullError } from './error-log';

export type TcpProbeResult = {
  ok: boolean;
  host: string;
  port: number;
  elapsedMs: number;
  error?: string;
};

export function parseDatabaseTarget(rawUrl: string): { host: string; port: number } {
  const parsed = new URL(rawUrl.replace(/^postgres:\/\//, 'postgresql://'));
  return {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 5432,
  };
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
