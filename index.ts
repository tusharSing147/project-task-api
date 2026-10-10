import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/modules/auth/route';
import projectRoutes from './src/modules/projects/route';
import taskRoutes from './src/modules/tasks/route';
import dashboardRoutes from './src/modules/dashboard/route';
import { connectMongo } from './src/libs/config/mongoose';
import { prisma } from './src/libs/config/prismaClient';
import { swaggerSetup } from './src/libs/config/swagger';
import { HttpError } from './src/libs/helper/httpError';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'API is healthy' }));
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
swaggerSetup(app);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found', data: null });
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError || err?.name === 'HttpError') {
    res.status(err.statusCode).json({ success: false, message: err.message, data: err.data ?? null }); return;
  }
  console.error(err);
  if (err?.code === 'P2002') {
    res.status(409).json({ success: false, message: 'A record with this value already exists', data: null }); return;
  }
  if (err?.name === 'ValidationError' || err?.name === 'CastError') {
    res.status(422).json({ success: false, message: 'Invalid request data', data: err.message }); return;
  }
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Invalid or expired token', data: null }); return;
  }
  res.status(500).json({ success: false, message: 'Internal server error', data: null });
});

const port = Number(process.env.PORT || 3000);
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  await prisma.$connect();
  await connectMongo();
  app.listen(port, () => console.log(`API listening on port ${port}`));
}
if (require.main === module) start().catch((e) => { console.error('Startup failed:', e); process.exit(1); });
export default app;
