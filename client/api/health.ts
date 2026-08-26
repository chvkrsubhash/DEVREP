export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    service: 'devrep-api',
    timestamp: new Date().toISOString(),
  });
}
