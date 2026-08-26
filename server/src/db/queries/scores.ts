import { query } from '../pool';
import { ReputationScoreResult, SubScores, DataMode, HistoricalSnapshot } from '@devrep/shared';

export interface DbPublicScoreRow {
  id: number;
  username: string;
  overall_score: number;
  tier: string;
  tier_description: string;
  sub_scores: SubScores;
  breakdown: any;
  anti_gaming: any;
  meta: any;
  computed_at: string;
}

export interface DbPrivateScoreRow {
  id: number;
  user_id: number;
  overall_score: number;
  tier: string;
  tier_description: string;
  sub_scores: SubScores;
  breakdown: any;
  anti_gaming: any;
  meta: any;
  computed_at: string;
}

/* =========================================================================
 * PUBLIC SCORES DAL
 * AUDIT BOUNDARY: Queries here MUST ONLY operate on public data.
 * No private repository metrics or authenticated user tokens can leak here.
 * ========================================================================= */

export async function getPublicScore(username: string): Promise<ReputationScoreResult | null> {
  const res = await query<DbPublicScoreRow>(
    `SELECT username, overall_score, tier, tier_description, sub_scores, breakdown, anti_gaming, meta, computed_at
     FROM public_scores
     WHERE LOWER(username) = LOWER($1)`,
    [username]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    username: row.username,
    avatarUrl: row.meta?.avatarUrl || `https://github.com/${row.username}.png`,
    name: row.meta?.name,
    bio: row.meta?.bio,
    company: row.meta?.company,
    location: row.meta?.location,
    dataMode: 'public',
    overallScore: row.overall_score,
    tier: row.tier as any,
    tierDescription: row.tier_description,
    subScores: row.sub_scores,
    breakdown: row.breakdown,
    antiGaming: row.anti_gaming,
    meta: {
      ...row.meta,
      computedAt: new Date(row.computed_at).toISOString(),
      cached: true,
    },
  };
}

export async function savePublicScore(score: ReputationScoreResult): Promise<void> {
  const metaWithProfile = {
    ...score.meta,
    avatarUrl: score.avatarUrl,
    name: score.name,
    bio: score.bio,
    company: score.company,
    location: score.location,
  };

  await query(
    `
    INSERT INTO public_scores (username, overall_score, tier, tier_description, sub_scores, breakdown, anti_gaming, meta, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (username) DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      tier = EXCLUDED.tier,
      tier_description = EXCLUDED.tier_description,
      sub_scores = EXCLUDED.sub_scores,
      breakdown = EXCLUDED.breakdown,
      anti_gaming = EXCLUDED.anti_gaming,
      meta = EXCLUDED.meta,
      computed_at = CURRENT_TIMESTAMP
    `,
    [
      score.username,
      score.overallScore,
      score.tier,
      score.tierDescription,
      JSON.stringify(score.subScores),
      JSON.stringify(score.breakdown),
      JSON.stringify(score.antiGaming),
      JSON.stringify(metaWithProfile),
    ]
  );
}

/* =========================================================================
 * PRIVATE SCORES DAL
 * AUDIT BOUNDARY: Queries here are strictly isolated to authenticated self-user.
 * user_id is foreign-keyed to the users table and verified in auth middleware.
 * ========================================================================= */

export async function getPrivateScore(userId: number): Promise<ReputationScoreResult | null> {
  const res = await query<DbPrivateScoreRow>(
    `SELECT p.user_id, p.overall_score, p.tier, p.tier_description, p.sub_scores, p.breakdown, p.anti_gaming, p.meta, p.computed_at, u.username
     FROM private_scores p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId]
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    username: (row as any).username,
    avatarUrl: row.meta?.avatarUrl || `https://github.com/${(row as any).username}.png`,
    name: row.meta?.name,
    bio: row.meta?.bio,
    company: row.meta?.company,
    location: row.meta?.location,
    dataMode: 'private-inclusive',
    overallScore: row.overall_score,
    tier: row.tier as any,
    tierDescription: row.tier_description,
    subScores: row.sub_scores,
    breakdown: row.breakdown,
    antiGaming: row.anti_gaming,
    meta: {
      ...row.meta,
      computedAt: new Date(row.computed_at).toISOString(),
      cached: true,
    },
  };
}

export async function savePrivateScore(userId: number, score: ReputationScoreResult): Promise<void> {
  const metaWithProfile = {
    ...score.meta,
    avatarUrl: score.avatarUrl,
    name: score.name,
    bio: score.bio,
    company: score.company,
    location: score.location,
  };

  await query(
    `
    INSERT INTO private_scores (user_id, overall_score, tier, tier_description, sub_scores, breakdown, anti_gaming, meta, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id) DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      tier = EXCLUDED.tier,
      tier_description = EXCLUDED.tier_description,
      sub_scores = EXCLUDED.sub_scores,
      breakdown = EXCLUDED.breakdown,
      anti_gaming = EXCLUDED.anti_gaming,
      meta = EXCLUDED.meta,
      computed_at = CURRENT_TIMESTAMP
    `,
    [
      userId,
      score.overallScore,
      score.tier,
      score.tierDescription,
      JSON.stringify(score.subScores),
      JSON.stringify(score.breakdown),
      JSON.stringify(score.antiGaming),
      JSON.stringify(metaWithProfile),
    ]
  );
}

/* =========================================================================
 * SCORE SNAPSHOTS DAL
 * ========================================================================= */

export async function recordScoreSnapshot(
  username: string,
  userId: number | null,
  dataMode: DataMode,
  overallScore: number,
  subScores: SubScores
): Promise<void> {
  await query(
    `
    INSERT INTO score_snapshots (username, user_id, data_mode, overall_score, sub_scores, computed_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `,
    [username, userId, dataMode, overallScore, JSON.stringify(subScores)]
  );
}

export async function getScoreSnapshots(username: string, mode: DataMode): Promise<HistoricalSnapshot[]> {
  const res = await query<{
    id: number;
    overall_score: number;
    sub_scores: SubScores;
    data_mode: DataMode;
    computed_at: string;
  }>(
    `
    SELECT id, overall_score, sub_scores, data_mode, computed_at
    FROM score_snapshots
    WHERE LOWER(username) = LOWER($1) AND data_mode = $2
    ORDER BY computed_at ASC
    LIMIT 30
    `,
    [username, mode]
  );

  return res.rows.map(r => ({
    id: String(r.id),
    overallScore: r.overall_score,
    subScores: r.sub_scores,
    dataMode: r.data_mode,
    computedAt: new Date(r.computed_at).toISOString(),
  }));
}
