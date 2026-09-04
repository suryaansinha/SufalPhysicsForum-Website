type ErrorShape = {
  code?: unknown;
  message?: unknown;
  meta?: unknown;
  cause?: unknown;
};

function asRecord(value: unknown): ErrorShape | null {
  if (value && typeof value === 'object') {
    return value as ErrorShape;
  }
  return null;
}

function collectMessages(error: unknown, depth = 0): string[] {
  if (depth > 6 || error == null) {
    return [];
  }

  if (typeof error === 'string') {
    return [error];
  }

  const record = asRecord(error);
  if (!record) {
    return [];
  }

  const messages: string[] = [];
  if (typeof record.message === 'string' && record.message.trim()) {
    messages.push(record.message);
  }

  const meta = asRecord(record.meta);
  if (meta) {
    if (typeof meta.message === 'string') {
      messages.push(meta.message);
    }
    messages.push(...collectMessages(meta, depth + 1));
  }

  messages.push(...collectMessages(record.cause, depth + 1));
  return messages;
}

function collectCodes(error: unknown, depth = 0): string[] {
  if (depth > 6 || error == null) {
    return [];
  }

  const record = asRecord(error);
  if (!record) {
    return [];
  }

  const codes: string[] = [];
  if (record.code != null) {
    codes.push(String(record.code));
  }

  const meta = asRecord(record.meta);
  if (meta?.code != null) {
    codes.push(String(meta.code));
  }

  codes.push(...collectCodes(record.meta, depth + 1));
  codes.push(...collectCodes(record.cause, depth + 1));
  return codes;
}

function collectFsMeta(error: unknown, depth = 0): { path?: string; syscall?: string; errno?: string; stack?: string } {
  if (depth > 6 || error == null || typeof error !== 'object') {
    return {};
  }

  const record = error as {
    path?: unknown;
    syscall?: unknown;
    errno?: unknown;
    stack?: unknown;
    cause?: unknown;
    meta?: unknown;
  };

  const nested = {
    ...collectFsMeta(record.cause, depth + 1),
    ...collectFsMeta(record.meta, depth + 1),
  };

  return {
    path: typeof record.path === 'string' ? record.path : nested.path,
    syscall: typeof record.syscall === 'string' ? record.syscall : nested.syscall,
    errno: record.errno != null ? String(record.errno) : nested.errno,
    stack: typeof record.stack === 'string' ? record.stack : nested.stack,
  };
}

export function describeDatabaseError(error: unknown): {
  code: string;
  detail: string;
  path?: string;
  syscall?: string;
  errno?: string;
  stack?: string;
} {
  const codes = collectCodes(error);
  const messages = collectMessages(error);
  const fsMeta = collectFsMeta(error);
  return {
    code: codes[0] || 'UNKNOWN',
    detail: messages[0] || 'Unknown database error',
    ...fsMeta,
  };
}

export function databaseUnavailableMessage(error: unknown): string | null {
  const codes = collectCodes(error);
  const detail = collectMessages(error).join(' ').toLowerCase();

  if (
    codes.includes('ECONNREFUSED') ||
    codes.includes('ETIMEDOUT') ||
    codes.includes('ENOTFOUND') ||
    codes.includes('P1001') ||
    codes.includes('P1002') ||
    codes.includes('P1017')
  ) {
    return 'Database is unavailable. Set DATABASE_URL_V2 to a reachable PostgreSQL instance and restart the app.';
  }

  if (
    codes.includes('P2021') ||
    codes.includes('42P01') ||
    detail.includes('does not exist')
  ) {
    return 'Database schema is missing. Wait for prisma migrate deploy, then seed the database.';
  }

  if (
    codes.includes('42P05') ||
    detail.includes('prepared statement') ||
    detail.includes('maxclientsinsessionmode')
  ) {
    return 'Supabase transaction pooler is incompatible with this login query. Use the Session pooler URI (port 5432), not Transaction (6543).';
  }

  if (codes.includes('28P01') || detail.includes('password authentication failed')) {
    return 'PostgreSQL rejected the credentials in DATABASE_URL_V2.';
  }

  if (detail.includes('tenant or user not found')) {
    return 'Supabase rejected this connection string. Copy the URI from Project Settings > Database.';
  }

  if (codes.includes('EACCES') || detail.includes('eacces') || detail.includes('permission denied')) {
    return 'Prisma could not access an engine or cache file (EACCES). The GoDaddy runtime filesystem is read-only outside /public/assets.';
  }

  return null;
}
