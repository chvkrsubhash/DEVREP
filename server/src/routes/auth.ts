import { Router, Request, Response } from 'express';
import { upsertUser } from '../db/queries/users';
import { encryptToken } from '../utils/crypto';

export const authRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * 1. Initiate GitHub OAuth Login Flow
 * Requests `read:user` and `repo` (for private mode analytics)
 */
authRouter.get('/github', (req: Request, res: Response) => {
  if (!GITHUB_CLIENT_ID) {
    res.redirect(`${APP_URL}/?auth_error=oauth_not_configured`);
    return;
  }

  const redirectUri = encodeURIComponent(`${process.env.SERVER_URL || 'http://localhost:5000'}/auth/github/callback`);
  const scope = encodeURIComponent('read:user,repo');
  const state = Math.random().toString(36).substring(7);
  (req.session as any).oauthState = state;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  res.redirect(githubAuthUrl);
});

/**
 * 2. GitHub OAuth Callback
 * Exchanges code for access token, encrypts token, stores user, initiates session
 */
authRouter.get('/github/callback', async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.redirect(`${APP_URL}/?auth_error=missing_code`);
    return;
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      res.redirect(`${APP_URL}/?auth_error=token_exchange_failed`);
      return;
    }

    // Fetch authentic user profile from GitHub
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        'User-Agent': 'DevRep-App',
      },
    });

    const ghUser: any = await userRes.json();

    // Encrypt token before storing in PostgreSQL
    const encryptedToken = encryptToken(accessToken);

    const dbUser = await upsertUser(
      String(ghUser.id),
      ghUser.login,
      ghUser.avatar_url,
      encryptedToken
    );

    // Save authentic user session
    (req.session as any).user = {
      id: dbUser.id,
      githubId: dbUser.github_id,
      username: dbUser.username,
      avatarUrl: dbUser.avatar_url,
      hasPrivateAccess: true,
    };

    res.redirect(`${APP_URL}/dashboard`);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    res.redirect(`${APP_URL}/?auth_error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * 3. Current User Session Status
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  const sessionUser = (req.session as any)?.user;
  if (!sessionUser) {
    res.json({ isAuthenticated: false, user: null });
    return;
  }

  res.json({
    isAuthenticated: true,
    user: sessionUser,
  });
});

/**
 * 4. Logout
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});
