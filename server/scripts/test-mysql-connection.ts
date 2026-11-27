import mysql from 'mysql2/promise';

async function main(): Promise<void> {
  const host = process.env.DB_HOST;
  const port = Number(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;

  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].filter(
    (key) => !process.env[key]
  );
  if (missing.length > 0) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: `Missing required env vars: ${missing.join(', ')}`,
          present: {
            DB_HOST: Boolean(host),
            DB_PORT: process.env.DB_PORT ?? '(default 3306)',
            DB_USER: Boolean(user),
            DB_PASSWORD: Boolean(password),
            DB_NAME: Boolean(database),
          },
        },
        null,
        2
      )
    );
    process.exit(1);
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
    console.log(
      JSON.stringify(
        {
          ok: true,
          host,
          port,
          database,
          user,
          result: rows,
        },
        null,
        2
      )
    );
  } catch (error) {
    const err = error as Error & { code?: string; errno?: number; sqlState?: string };
    console.error(
      JSON.stringify(
        {
          ok: false,
          host,
          port,
          database,
          user,
          error: err.message,
          code: err.code,
          errno: err.errno,
          sqlState: err.sqlState,
          stack: err.stack,
        },
        null,
        2
      )
    );
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
