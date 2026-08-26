import { getUserById } from '../../server/src/db/queries/users';
import { decryptToken } from '../../server/src/utils/crypto';
import { fetchGitHubDeveloperData } from '../../server/src/services/githubFetcher';
import { computeDeveloperReputation } from '../../server/src/scoring/engine';
import { savePrivateScore, recordScoreSnapshot } from '../../server/src/db/queries/scores';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const cookies = req.headers.cookie || '';
  const match = cookies.match(/devrep_session=([^;]+)/);

  if (!match) {
    return res.status(401).json({ error: 'Unauthorized: Session authentication required' });
  }

  let sessionUser: any;
  try {
    sessionUser = JSON.parse(decodeURIComponent(match[1]));
  } catch (err) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  try {
    const dbUser = await getUserById(sessionUser.id);
    if (!dbUser) {
      return res.status(404).json({ error: 'User record not found.' });
    }

    const decryptedAccessToken = decryptToken(dbUser.encrypted_token);

    const rawData = await fetchGitHubDeveloperData(dbUser.username, {
      includePrivate: true,
      accessToken: decryptedAccessToken,
    });

    const scoreResult = computeDeveloperReputation(rawData, 'private-inclusive');

    try {
      await savePrivateScore(dbUser.id, scoreResult);
      await recordScoreSnapshot(
        dbUser.username,
        dbUser.id,
        'private-inclusive',
        scoreResult.overallScore,
        scoreResult.subScores
      );
    } catch (saveErr) {}

    return res.json(scoreResult);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to compute private score', message: error.message });
  }
}
