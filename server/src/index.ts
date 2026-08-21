import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
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

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
