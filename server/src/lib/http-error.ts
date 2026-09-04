export function databaseUnavailableMessage(error: unknown): string | null {
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';

  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'P1001' ||
    code === 'P1002' ||
    code === 'P1017'
  ) {
    return 'Database is unavailable. Set DATABASE_URL_V2 to a reachable PostgreSQL instance and restart the app.';
  }

  if (code === 'P2021' || code === 'P2010' || code === '42P01') {
    return 'Database schema is missing. Run prisma migrate deploy against DATABASE_URL_V2.';
  }

  return null;
}
