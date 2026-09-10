#!/usr/bin/env node
const net = require('net');

const host = process.env.MYSQL_HOST || process.argv[2];
const port = Number(process.env.MYSQL_PORT || process.argv[3] || 3306);
const timeoutMs = 8000;

if (!host) {
  console.error(JSON.stringify({
    ok: false,
    error: 'MYSQL_HOST is unset. Pass host as argv[2] or set MYSQL_HOST. Default port is 3306.',
  }, null, 2));
  process.exit(1);
}

const startedAt = Date.now();
const socket = net.createConnection({ host, port });
socket.setTimeout(timeoutMs);

socket.on('connect', () => {
  const result = { ok: true, host, port, elapsedMs: Date.now() - startedAt };
  console.log(JSON.stringify(result, null, 2));
  socket.destroy();
  process.exit(0);
});

socket.on('timeout', () => {
  const result = {
    ok: false,
    host,
    port,
    elapsedMs: Date.now() - startedAt,
    error: `TCP timeout after ${timeoutMs}ms connecting to ${host}:${port}`,
  };
  console.error(JSON.stringify(result, null, 2));
  socket.destroy();
  process.exit(1);
});

socket.on('error', (error) => {
  const result = {
    ok: false,
    host,
    port,
    elapsedMs: Date.now() - startedAt,
    error: error.message,
    code: error.code,
    syscall: error.syscall,
    errno: error.errno,
  };
  console.error(JSON.stringify(result, null, 2));
  socket.destroy();
  process.exit(1);
});
