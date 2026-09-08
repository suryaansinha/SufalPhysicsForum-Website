import 'dotenv/config';
import './prisma-env';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { logFullError } from './lib/error-log';
import { probeConfiguredDatabaseTcp } from './lib/tcp-diag';
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

app.get('/api/diag/tcp', async (_req: Request, res: Response) => {
  try {
    const result = await probeConfiguredDatabaseTcp();
    if (!result) {
      res.status(500).json({
        ok: false,
        message: 'Set MYSQL_HOST (and optional MYSQL_PORT, default 3306) or DATABASE_URL_V2',
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
    await prisma.$queryRaw`SELECT 1`;
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
  if (!process.env.DATABASE_URL_V2) {
    console.warn('DATABASE_URL_V2 is not set; skipping prisma migrate deploy');
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
          DATABASE_URL: process.env.DATABASE_URL_V2,
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
    const tcp = await probeConfiguredDatabaseTcp();
    if (tcp) {
      console.log('Startup TCP probe (MySQL):', tcp);
    } else {
      console.warn(
        'MYSQL_HOST / DATABASE_URL_V2 not set; skipping startup TCP probe. Set MYSQL_HOST and MYSQL_PORT=3306 to test GoDaddy MySQL.'
      );
    }
  } catch (error) {
    logFullError(error, 'startup tcp probe');
  }

  await applyMigrations();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
