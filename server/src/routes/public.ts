import { Router, Request, Response } from 'express';
import { fetchGitHubDeveloperData } from '../services/githubFetcher';
import { computeDeveloperReputation } from '../scoring/engine';
import { getPublicScore, savePublicScore, recordScoreSnapshot, getScoreSnapshots } from '../db/queries/scores';

export const publicRouter = Router();

/**
 * ============================================================================
 * PUBLIC REPUTATION SCORE ENDPOINT
 * ============================================================================
 * CRITICAL SECURITY & PRIVACY BOUNDARY:
 * 1. This route NEVER requires authentication.
 * 2. This route MUST NEVER accept or request private repository scopes.
 * 3. `includePrivate` is STRICTLY hardcoded to `false`.
 * 4. Stored in `public_scores` cache only.
 * ============================================================================
 */
publicRouter.get('/:username', async (req: Request, res: Response) => {
  const username = req.params.username.trim();
  const forceRefresh = req.query.refresh === 'true';

  if (!username || username.length > 100) {
    res.status(400).json({ error: 'Invalid GitHub username provided.' });
    return;
  }

  try {
    // 1. Check cache in PostgreSQL public_scores table
    if (!forceRefresh) {
      try {
        const cached = await getPublicScore(username);
        if (cached) {
          // If cached within past 30 minutes, return directly
          const cacheAgeMs = Date.now() - new Date(cached.meta.computedAt).getTime();
          if (cacheAgeMs < 30 * 60 * 1000) {
            res.json(cached);
            return;
          }
        }
      } catch (dbErr) {
        // Continue to fresh calculation if DB is unavailable
      }
    }

    // 2. Fetch raw public data from GitHub
    // AUDIT: includePrivate is strictly false!
    const rawData = await fetchGitHubDeveloperData(username, {
      includePrivate: false,
    });

    // 3. Compute score through pure mathematical engine
    const scoreResult = computeDeveloperReputation(rawData, 'public');

    // 4. Persist to public cache and record history snapshot
    try {
      await savePublicScore(scoreResult);
      await recordScoreSnapshot(
        scoreResult.username,
        null,
        'public',
        scoreResult.overallScore,
        scoreResult.subScores
      );
    } catch (saveErr) {
      // Non-fatal if DB is in memory/dev fallback
    }

    res.json(scoreResult);
  } catch (error: any) {
    const isNotFound = error.message?.includes('Not Found') || error.status === 404;
    res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'User Not Found' : 'Failed to calculate developer reputation',
      message: isNotFound ? `GitHub user "${username}" was not found.` : error.message,
    });
  }
});

/**
 * Historical snapshot trajectory for public profiles
 */
publicRouter.get('/:username/history', async (req: Request, res: Response) => {
  const username = req.params.username.trim();
  try {
    const snapshots = await getScoreSnapshots(username, 'public');
    res.json(snapshots);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve score history', message: error.message });
  }
});
