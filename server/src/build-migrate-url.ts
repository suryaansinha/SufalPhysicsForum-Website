const g = globalThis as unknown as { __mysqlMigrateUrlInitialized?: boolean };

function applyMysqlDatabaseUrl(): void {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = process.env.DB_PORT || '3306';

  if (!host || !user || !password || !database) {
    console.warn(
      'build-migrate-url: DB_HOST/DB_USER/DB_PASSWORD/DB_NAME missing; leaving DATABASE_URL unchanged'
    );
    return;
  }

  process.env.DATABASE_URL = `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

if (!g.__mysqlMigrateUrlInitialized) {
  g.__mysqlMigrateUrlInitialized = true;
  applyMysqlDatabaseUrl();
  console.log('build-migrate-url: DATABASE_URL set from DB_*', {
    host: process.env.DB_HOST || null,
    port: process.env.DB_PORT || '3306',
    database: process.env.DB_NAME || null,
    user: process.env.DB_USER || null,
    present: {
      DB_HOST: Boolean(process.env.DB_HOST),
      DB_PORT: Boolean(process.env.DB_PORT),
      DB_USER: Boolean(process.env.DB_USER),
      DB_PASSWORD: Boolean(process.env.DB_PASSWORD),
      DB_NAME: Boolean(process.env.DB_NAME),
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
    },
  });
}
