import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
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
          callback(null, true); // Allow dev origins
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

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

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
