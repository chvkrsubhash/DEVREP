import { upsertUser } from '../../../../server/src/db/queries/users';
import { encryptToken } from '../../../../server/src/utils/crypto';

export default async function handler(req: any, res: any) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
  const APP_URL = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');

  const { code } = req.query;

  if (!code) {
    return res.redirect(`${APP_URL}/?auth_error=missing_code`);
  }

  try {
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
      return res.redirect(`${APP_URL}/?auth_error=token_exchange_failed`);
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${accessToken}`,
        'User-Agent': 'DevRep-App',
      },
    });

    const ghUser: any = await userRes.json();
    const encryptedToken = encryptToken(accessToken);

    const dbUser = await upsertUser(
      String(ghUser.id),
      ghUser.login,
      ghUser.avatar_url,
      encryptedToken
    );

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

    return res.redirect(`${APP_URL}/dashboard`);
  } catch (error: any) {
    console.error('OAuth Callback Error:', error);
    return res.redirect(`${APP_URL}/?auth_error=${encodeURIComponent(error.message)}`);
  }
}
