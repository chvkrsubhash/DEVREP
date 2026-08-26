export default function handler(req: any, res: any) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
  const APP_URL = process.env.APP_URL || (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000');
  const SERVER_URL = process.env.SERVER_URL || APP_URL;

  if (!GITHUB_CLIENT_ID) {
    return res.redirect(`${APP_URL}/?auth_error=oauth_not_configured`);
  }

  const redirectUri = encodeURIComponent(`${SERVER_URL}/api/auth/github/callback`);
  const scope = encodeURIComponent('read:user,repo');
  const state = Math.random().toString(36).substring(7);

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
  return res.redirect(githubAuthUrl);
}
