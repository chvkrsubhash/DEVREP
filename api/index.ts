export default async function handler(req: any, res: any) {
  const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23livDZ4uG6GT8OOvA';
  const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '164b7d1578c75da3131459c187369e6b214ff70e';
  
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  const { pathname, searchParams } = new URL(req.url, baseUrl);

  // 1. Initiate GitHub OAuth Login Flow
  if (pathname.includes('/auth/github') && !pathname.includes('/callback')) {
    const redirectUri = encodeURIComponent(`${baseUrl}/api/auth/callback`);
    const scope = encodeURIComponent('read:user,repo');
    const state = Math.random().toString(36).substring(7);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    res.writeHead(302, { Location: githubAuthUrl });
    return res.end();
  }

  // 2. GitHub OAuth Callback
  if (pathname.includes('/auth/callback') || pathname.includes('/auth/github/callback')) {
    const code = searchParams.get('code');

    if (!code) {
      res.writeHead(302, { Location: `${baseUrl}/?auth_error=missing_code` });
      return res.end();
    }

    try {
      // Exchange authorization code for GitHub access token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
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

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        res.writeHead(302, { Location: `${baseUrl}/?auth_error=token_exchange_failed` });
        return res.end();
      }

      // Fetch verified GitHub user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `token ${accessToken}`,
          'User-Agent': 'DevRep-App',
        },
      });

      const ghUser: any = await userRes.json();

      // Redirect back to frontend dashboard with authenticated token payload
      const targetUrl = `${baseUrl}/dashboard?token=${encodeURIComponent(accessToken)}&username=${encodeURIComponent(ghUser.login)}&avatar=${encodeURIComponent(ghUser.avatar_url || '')}&id=${encodeURIComponent(String(ghUser.id))}`;
      res.writeHead(302, { Location: targetUrl });
      return res.end();
    } catch (err: any) {
      res.writeHead(302, { Location: `${baseUrl}/?auth_error=${encodeURIComponent(err.message)}` });
      return res.end();
    }
  }

  res.status(404).json({ error: 'Endpoint not found' });
}
