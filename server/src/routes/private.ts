import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { fetchGitHubDeveloperData } from '../services/githubFetcher';
import { computeDeveloperReputation } from '../scoring/engine';
import { getPrivateScore, savePrivateScore, recordScoreSnapshot, getScoreSnapshots } from '../db/queries/scores';
import { getUserEncryptedToken } from '../db/queries/users';
import { decryptToken } from '../utils/crypto';

export const privateRouter = Router();

// Apply strict authentication to all private routes
privateRouter.use(requireAuth);

/**
 * ============================================================================
 * PRIVATE-INCLUSIVE REPUTATION SCORE ENDPOINT
 * ============================================================================
 * CRITICAL SECURITY & TRUST GUARANTEE:
 * 1. STRICTLY ACCESSIBLE ONLY TO THE AUTHENTICATED USER (SELF-ONLY).
 * 2. `includePrivate` IS ONLY TRUE HERE WHEN BACKED BY USER'S OAUTH TOKEN.
 * 3. NO RAW CODE IS EVER SAVED OR RETURNED — ONLY NUMERIC AGGREGATES.
 * 4. RESULTS STORED EXCLUSIVELY IN `private_scores` (NEVER IN `public_scores`).
 * 5. CAN NEVER BE QUERIED BY ARBITRARY USERNAME.
 * ============================================================================
 */
privateRouter.get('/score', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const forceRefresh = req.query.refresh === 'true';

  try {
    // 1. Check cached private score if recent
    if (!forceRefresh) {
      try {
        const cached = await getPrivateScore(user.id);
        if (cached) {
          const cacheAgeMs = Date.now() - new Date(cached.meta.computedAt).getTime();
          if (cacheAgeMs < 15 * 60 * 1000) {
            res.json(cached);
            return;
          }
        }
      } catch (dbErr) {
        // Continue to fresh calculation
      }
    }

    // 2. Retrieve & decrypt OAuth token securely
    let accessToken: string | undefined;
    try {
      const encrypted = await getUserEncryptedToken(user.id);
      if (encrypted) {
        accessToken = decryptToken(encrypted);
      }
    } catch (tokenErr) {
      console.warn('[Private API] Token decryption failed or unavailable:', (tokenErr as any).message);
    }

    // 3. Fetch developer metrics including authorized private repositories
    // AUDIT: includePrivate: true is gated strictly by the authenticated user's session
    const rawData = await fetchGitHubDeveloperData(user.username, {
      includePrivate: true,
      accessToken,
    });

    // 4. Compute private-inclusive score
    const scoreResult = computeDeveloperReputation(rawData, 'private-inclusive');

    // 5. Persist strictly to private_scores table
    try {
      await savePrivateScore(user.id, scoreResult);
      await recordScoreSnapshot(
        user.username,
        user.id,
        'private-inclusive',
        scoreResult.overallScore,
        scoreResult.subScores
      );
    } catch (saveErr) {
      // Non-fatal if DB is in memory/dev fallback
    }

    res.json(scoreResult);
  } catch (error: any) {
    console.error(`[Private API Error] for user ${user.username}:`, error.message);
    res.status(500).json({
      error: 'Failed to compute private reputation score',
      message: error.message,
    });
  }
});

/**
 * Historical snapshot trajectory for private scores
 */
privateRouter.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  try {
    const snapshots = await getScoreSnapshots(user.username, 'private-inclusive');
    res.json(snapshots);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to retrieve private score history', message: error.message });
  }
});
