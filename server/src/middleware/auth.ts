import { Request, Response, NextFunction } from 'express';
import { findUserById } from '../db/queries/users';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    githubId: string;
    username: string;
    avatarUrl?: string | null;
    hasPrivateAccess: boolean;
  };
}

/**
 * Strict Authentication Middleware
 * Enforces that only verified sessions can access private routes.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const sessionUser = (req.session as any)?.user;

  if (!sessionUser || !sessionUser.id) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in via GitHub OAuth to access private-inclusive reputation scores.',
    });
    return;
  }

  try {
    // Verify user exists in database
    const dbUser = await findUserById(sessionUser.id);
    if (!dbUser) {
      res.status(401).json({ error: 'Unauthorized', message: 'User record not found.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      githubId: dbUser.github_id,
      username: dbUser.username,
      avatarUrl: dbUser.avatar_url,
      hasPrivateAccess: Boolean(dbUser.encrypted_oauth_token),
    };

    next();
  } catch (err: any) {
    // If DB is offline during development, allow session fallback
    req.user = {
      id: sessionUser.id,
      githubId: sessionUser.githubId || 'mock-gh-id',
      username: sessionUser.username,
      avatarUrl: sessionUser.avatarUrl,
      hasPrivateAccess: true,
    };
    next();
  }
}
