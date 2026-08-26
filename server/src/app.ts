import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import path from 'path';
import fs from 'fs';
import { authRouter } from './routes/auth';
import { publicRouter } from './routes/public';
import { privateRouter } from './routes/private';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CORS configuration
  const allowedOrigins = [
    process.env.APP_URL || 'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Allow dev & production origins
        }
      },
      credentials: true,
    })
  );

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'devrep-secret-session-key-dev-mode',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'lax',
      },
    })
  );

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'devrep-api',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount Route Modules
  app.use('/auth', authRouter);
  app.use('/api/public', publicRouter);
  app.use('/api/me', privateRouter);

  // Static Assets & Single-Page Application (SPA) Serving
  const possibleDistPaths = [
    path.resolve(process.cwd(), 'dist'),
    path.resolve(__dirname, '../../dist'),
    path.resolve(__dirname, '../dist'),
    path.resolve(process.cwd(), 'client/dist'),
  ];

  const distPath = possibleDistPaths.find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'dist');

  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));

    // Fallback for all SPA page routes (e.g. /, /u/:username, /compare, /dashboard)
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Frontend build not found. Please build the client.');
      }
    });
  } else {
    // 404 handler if no static frontend build exists
    app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred.',
    });
  });

  return app;
}
