import { getScoreSnapshots } from '../../../../../server/src/db/queries/scores';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username required' });
  }

  try {
    const snapshots = await getScoreSnapshots(username.trim(), 'public');
    return res.json(snapshots);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve score history', message: error.message });
  }
}
