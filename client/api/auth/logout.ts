export default function handler(req: any, res: any) {
  res.setHeader(
    'Set-Cookie',
    'devrep_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;'
  );
  return res.json({ success: true, message: 'Logged out successfully' });
}
