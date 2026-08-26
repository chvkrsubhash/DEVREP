import { fetchGitHubDeveloperData } from '../../../../server/src/services/githubFetcher';
import { computeDeveloperReputation } from '../../../../server/src/scoring/engine';
import { getPublicScore, savePublicScore, recordScoreSnapshot } from '../../../../server/src/db/queries/scores';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { username } = req.query;
  const forceRefresh = req.query.refresh === 'true';

  if (!username || typeof username !== 'string' || username.length > 100) {
    return res.status(400).json({ error: 'Invalid GitHub username provided.' });
  }

  const cleanUsername = username.trim();

  try {
    if (!forceRefresh) {
      try {
        const cached = await getPublicScore(cleanUsername);
        if (cached) {
          const cacheAgeMs = Date.now() - new Date(cached.meta.computedAt).getTime();
          if (cacheAgeMs < 30 * 60 * 1000) {
            return res.json(cached);
          }
        }
      } catch (dbErr) {
        // Fallback to fresh compute
      }
    }

    const rawData = await fetchGitHubDeveloperData(cleanUsername, {
      includePrivate: false,
    });

    const scoreResult = computeDeveloperReputation(rawData, 'public');

    try {
      await savePublicScore(scoreResult);
      await recordScoreSnapshot(
        scoreResult.username,
        null,
        'public',
        scoreResult.overallScore,
        scoreResult.subScores
      );
    } catch (saveErr) {}

    return res.json(scoreResult);
  } catch (error: any) {
    const isNotFound = error.message?.includes('Not Found') || error.status === 404;
    return res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'User Not Found' : 'Failed to calculate developer reputation',
      message: isNotFound ? `GitHub user "${cleanUsername}" was not found.` : error.message,
    });
  }
}
