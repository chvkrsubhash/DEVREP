import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fetchGitHubDeveloperData } from './github';
import { computeDeveloperReputation } from './scoring';
import {
  getPublicScore,
  savePublicScore,
  recordScoreSnapshot,
  getScoreSnapshots,
  upsertUser,
  getUserById,
  savePrivateScore,
} from './db';
import { encryptToken, decryptToken } from './crypto';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

// 1. Health Check
app.get(['/health', '/api/health'], (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'devrep-unified-api', timestamp: new Date().toISOString() });
});

// 2. Public Score Calculation & Cache
app.get(['/public/:username', '/api/public/:username'], async (req: Request, res: Response) => {
  const username = req.params.username?.trim();
  const forceRefresh = req.query.refresh === 'true';

  if (!username) {
    res.status(400).json({ error: 'Username is required.' });
    return;
  }

  try {
    if (!forceRefresh) {
      const cached = await getPublicScore(username);
      if (cached) {
        const cacheAgeMs = Date.now() - new Date(cached.meta.computedAt).getTime();
        if (cacheAgeMs < 30 * 60 * 1000) {
          res.json(cached);
          return;
        }
      }
    }

    const rawData = await fetchGitHubDeveloperData(username, { includePrivate: false });
    const scoreResult = computeDeveloperReputation(rawData, 'public');

    try {
      await savePublicScore(scoreResult);
      await recordScoreSnapshot(scoreResult.username, null, 'public', scoreResult.overallScore, scoreResult.subScores);
    } catch (saveErr) {}

    res.json(scoreResult);
  } catch (err: any) {
    const isNotFound = err.message?.includes('not found') || err.status === 404;
    res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'User Not Found' : 'Calculation Failed',
      message: err.message,
    });
  }
});

// 3. Historical Score Snapshots
app.get(['/public/:username/history', '/api/public/:username/history'], async (req: Request, res: Response) => {
  const username = req.params.username?.trim();
  try {
    const snapshots = await getScoreSnapshots(username, 'public');
    res.json(snapshots);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
});

// 4. GitHub OAuth Login Initiation
app.get(['/auth/github', '/api/auth/github'], (req: Request, res: Response) => {
  const appUrl = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
  const serverUrl = process.env.SERVER_URL || appUrl;

  if (!GITHUB_CLIENT_ID) {
    res.redirect(`${appUrl}/?auth_error=oauth_not_configured`);
    return;
  }

  const redirectUri = encodeURIComponent(`${serverUrl}/api/auth/github/callback`);
  const scope = encodeURIComponent('read:user,repo');
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  res.redirect(authUrl);
});

// 5. GitHub OAuth Callback
app.get(['/auth/github/callback', '/api/auth/github/callback'], async (req: Request, res: Response) => {
  const appUrl = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
  const code = req.query.code as string;

  if (!code) {
    res.redirect(`${appUrl}/?auth_error=missing_code`);
    return;
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData: any = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      res.redirect(`${appUrl}/?auth_error=token_exchange_failed`);
      return;
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}`, 'User-Agent': 'DevRep-App' },
    });
    const ghUser: any = await userRes.json();
    const encryptedToken = encryptToken(accessToken);

    const dbUser = await upsertUser(String(ghUser.id), ghUser.login, ghUser.avatar_url, encryptedToken);

    const sessionPayload = {
      id: dbUser.id,
      githubId: dbUser.github_id,
      username: dbUser.username,
      avatarUrl: dbUser.avatar_url,
      hasPrivateAccess: true,
    };

    const cookieValue = encodeURIComponent(JSON.stringify(sessionPayload));
    res.setHeader(
      'Set-Cookie',
      `devrep_session=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
    );

    res.redirect(`${appUrl}/dashboard`);
  } catch (err: any) {
    res.redirect(`${appUrl}/?auth_error=${encodeURIComponent(err.message)}`);
  }
});

// 6. User Session Check
app.get(['/auth/me', '/api/auth/me'], (req: Request, res: Response) => {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/devrep_session=([^;]+)/);
  if (!match) {
    res.json({ isAuthenticated: false, user: null });
    return;
  }
  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    res.json({ isAuthenticated: true, user });
  } catch (e) {
    res.json({ isAuthenticated: false, user: null });
  }
});

// 7. Logout
app.post(['/auth/logout', '/api/auth/logout'], (req: Request, res: Response) => {
  res.setHeader('Set-Cookie', 'devrep_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;');
  res.json({ success: true, message: 'Logged out successfully' });
});

// 8. Private Dashboard Score Calculation
app.get(['/me/score', '/api/me/score'], async (req: Request, res: Response) => {
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/devrep_session=([^;]+)/);
  if (!match) {
    res.status(401).json({ error: 'Session authentication required' });
    return;
  }

  try {
    const sessionUser = JSON.parse(decodeURIComponent(match[1]));
    const dbUser = await getUserById(sessionUser.id);
    if (!dbUser) {
      res.status(404).json({ error: 'User record not found.' });
      return;
    }

    const decryptedToken = decryptToken(dbUser.encrypted_token);
    const rawData = await fetchGitHubDeveloperData(dbUser.username, {
      includePrivate: true,
      accessToken: decryptedToken,
    });

    const scoreResult = computeDeveloperReputation(rawData, 'private-inclusive');

    try {
      await savePrivateScore(dbUser.id, scoreResult);
      await recordScoreSnapshot(dbUser.username, dbUser.id, 'private-inclusive', scoreResult.overallScore, scoreResult.subScores);
    } catch (saveErr) {}

    res.json(scoreResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to compute private score', message: err.message });
  }
});

// Default Serverless Handler
export default function handler(req: any, res: any) {
  return app(req, res);
}
