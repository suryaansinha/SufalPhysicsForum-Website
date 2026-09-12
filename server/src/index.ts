import 'dotenv/config';
import './prisma-env';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { logFullError } from './lib/error-log';
import { probeConfiguredDatabaseTcp } from './lib/tcp-diag';
import { prisma } from './lib/prisma';
import { pingDatabase } from './db/raw-queries';
import { probeMysqlDbStatus, probeMysqlSelect1 } from './lib/mysql-diag';
import { probeMariadbPoolGetConnection } from './lib/mysql-pool-diag';
import { buildMysqlDatabaseUrl } from './lib/mysql-url';
import authRoutes from './routes/auth.routes';
import batchRoutes from './routes/batch.routes';
import studentRoutes from './routes/student.routes';
import attendanceRoutes from './routes/attendance.routes';
import liveClassRoutes from './routes/live-class.routes';
import materialRoutes from './routes/material.routes';
import homeworkRoutes from './routes/homework.routes';
import publicRoutes from './routes/public.routes';
import feeRoutes from './routes/fee.routes';
import forumRoutes from './routes/forum.routes';
import instituteRoutes from './routes/institute.routes';

const app = express();
const PORT: number = Number(process.env.PORT) || 5000;
const clientDistPath = path.resolve(__dirname, '../public');

const allowedOrigins: string[] = [
  'http://localhost:5173',
  ...(process.env.CLIENT_URL ?? '').split(','),
].filter((origin): origin is string => origin.trim().length > 0);

app.use(express.json());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.static(clientDistPath));

app.get('/api/diag/mysql', async (_req: Request, res: Response) => {
  try {
    const result = await probeMysqlSelect1();
    console.log('GET /api/diag/mysql', {
      ok: result.ok,
      present: result.present,
      missing: result.missing,
      host: result.host,
      port: result.port,
      database: result.database,
      user: result.user,
      error: result.error,
      code: result.code,
    });
    res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    logFullError(error, 'diag.mysql route');
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'MySQL probe failed',
    });
  }
});

app.get('/api/diag/pool', async (_req: Request, res: Response) => {
  try {
    const result = await probeMariadbPoolGetConnection();
    console.log('GET /api/diag/pool', result);
    res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    logFullError(error, 'diag.pool route');
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'Pool probe failed',
    });
  }
});

app.get('/api/diag/db-status', async (_req: Request, res: Response) => {
  try {
    const result = await probeMysqlDbStatus();
    console.log('GET /api/diag/db-status', result);
    res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    logFullError(error, 'diag.db-status route');
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'DB status probe failed',
    });
  }
});

app.get('/api/diag/tcp', async (_req: Request, res: Response) => {
  try {
    const result = await probeConfiguredDatabaseTcp();
    if (!result) {
      res.status(500).json({
        ok: false,
        message: 'Set DB_HOST (and optional DB_PORT, default 3306)',
      });
      return;
    }
    res.status(result.ok ? 200 : 503).json(result);
  } catch (error) {
    logFullError(error, 'diag.tcp route');
    res.status(500).json({
      ok: false,
      message: error instanceof Error ? error.message : 'TCP probe failed',
    });
  }
});

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await pingDatabase();
    res.json({
      status: 'ok',
      service: 'sufal-physics-forum-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'sufal-physics-forum-api',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/live-classes', liveClassRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/homework', homeworkRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/fees', feeRoutes);
app.use('/api/v1/forum', forumRoutes);
app.use('/api/v1/institute', instituteRoutes);

app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

const execFileAsync = promisify(execFile);

async function applyMigrations(): Promise<void> {
  const databaseUrl = buildMysqlDatabaseUrl();
  if (!databaseUrl) {
    console.warn('DB_HOST/DB_USER/DB_PASSWORD/DB_NAME are not set; skipping prisma migrate deploy');
    return;
  }

  const prismaBin = path.resolve(__dirname, '../node_modules/.bin/prisma');
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');

  try {
    const { stdout, stderr } = await execFileAsync(
      prismaBin,
      ['migrate', 'deploy', '--schema', schemaPath],
      {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl,
        },
      }
    );
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  } catch (error) {
    console.error('prisma migrate deploy failed:', error);
  }
}

async function start(): Promise<void> {
  try {
    const mysqlDiag = await probeMysqlSelect1();
    console.log('Startup MySQL probe:', {
      ok: mysqlDiag.ok,
      present: mysqlDiag.present,
      missing: mysqlDiag.missing,
      host: mysqlDiag.host,
      port: mysqlDiag.port,
      database: mysqlDiag.database,
      user: mysqlDiag.user,
      error: mysqlDiag.error,
      code: mysqlDiag.code,
    });
  } catch (error) {
    logFullError(error, 'startup mysql probe');
  }

  await applyMigrations();

  try {
    const institute = await prisma.institute.findFirst({
      select: { id: true, slug: true },
    });
    console.log('Startup Prisma+MySQL query probe:', {
      ok: true,
      found: Boolean(institute),
      instituteId: institute?.id,
      slug: institute?.slug,
    });
  } catch (error) {
    const err = error as Error & { code?: string };
    console.error('Startup Prisma+MySQL query probe:', {
      ok: false,
      error: err.message,
      code: err.code,
    });
    logFullError(error, 'startup prisma mysql query probe');
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
