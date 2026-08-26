export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const cookies = req.headers.cookie || '';
  const match = cookies.match(/devrep_session=([^;]+)/);

  if (!match) {
    return res.json({ isAuthenticated: false, user: null });
  }

  try {
    const user = JSON.parse(decodeURIComponent(match[1]));
    return res.json({ isAuthenticated: true, user });
  } catch (err) {
    return res.json({ isAuthenticated: false, user: null });
  }
}
