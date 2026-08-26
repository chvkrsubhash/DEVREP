import pg from 'pg';
const { Pool } = pg;

export interface UserRecord {
  id: string;
  github_id: string;
  username: string;
  avatar_url: string | null;
  encrypted_token: string;
  created_at: Date;
  updated_at: Date;
}

export interface ScoreCacheRecord {
  username: string;
  user_id?: string | null;
  overall_score: number;
  sub_scores: any;
  insights: string[];
  anti_gaming_flags: any[];
  computed_at: Date;
}

const connectionString = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString,
  ssl: connectionString && !connectionString.includes('localhost')
    ? { rejectUnauthorized: false }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let dbInitialized = false;

export async function ensureDatabase(): Promise<void> {
  if (dbInitialized || !process.env.DATABASE_URL) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          github_id VARCHAR(255) UNIQUE NOT NULL,
          username VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          encrypted_token TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS public_scores (
          username VARCHAR(255) PRIMARY KEY,
          overall_score DOUBLE PRECISION NOT NULL,
          sub_scores JSONB NOT NULL,
          insights JSONB NOT NULL DEFAULT '[]'::jsonb,
          anti_gaming_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
          data_source_mode VARCHAR(50) NOT NULL DEFAULT 'public',
          computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS private_scores (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          overall_score DOUBLE PRECISION NOT NULL,
          sub_scores JSONB NOT NULL,
          insights JSONB NOT NULL DEFAULT '[]'::jsonb,
          anti_gaming_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
          data_source_mode VARCHAR(50) NOT NULL DEFAULT 'private-inclusive',
          computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS score_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username VARCHAR(255) NOT NULL,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          score_type VARCHAR(50) NOT NULL,
          overall_score DOUBLE PRECISION NOT NULL,
          sub_scores JSONB NOT NULL,
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
      dbInitialized = true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn('DB initialization deferred:', err);
  }
}

export async function upsertUser(
  githubId: string,
  username: string,
  avatarUrl: string | null,
  encryptedToken: string
): Promise<UserRecord> {
  await ensureDatabase();
  const query = `
    INSERT INTO users (github_id, username, avatar_url, encrypted_token, updated_at)
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (github_id)
    DO UPDATE SET
      username = EXCLUDED.username,
      avatar_url = EXCLUDED.avatar_url,
      encrypted_token = EXCLUDED.encrypted_token,
      updated_at = NOW()
    RETURNING *;
  `;
  const result = await pool.query<UserRecord>(query, [githubId, username, avatarUrl, encryptedToken]);
  return result.rows[0];
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  await ensureDatabase();
  const result = await pool.query<UserRecord>('SELECT * FROM users WHERE id = $1 LIMIT 1;', [id]);
  return result.rows[0] || null;
}

export async function getPublicScore(username: string): Promise<any | null> {
  await ensureDatabase();
  const query = 'SELECT * FROM public_scores WHERE LOWER(username) = LOWER($1) LIMIT 1;';
  const result = await pool.query(query, [username]);
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  return {
    username: row.username,
    overallScore: Number(row.overall_score),
    subScores: row.sub_scores,
    insights: row.insights,
    antiGamingFlags: row.anti_gaming_flags,
    meta: {
      mode: row.data_source_mode,
      computedAt: row.computed_at.toISOString(),
      executionDurationMs: 0,
      repositoriesAnalyzed: 0,
    },
  };
}

export async function savePublicScore(scoreResult: any): Promise<void> {
  await ensureDatabase();
  const query = `
    INSERT INTO public_scores (username, overall_score, sub_scores, insights, anti_gaming_flags, data_source_mode, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (username)
    DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      sub_scores = EXCLUDED.sub_scores,
      insights = EXCLUDED.insights,
      anti_gaming_flags = EXCLUDED.anti_gaming_flags,
      data_source_mode = EXCLUDED.data_source_mode,
      computed_at = EXCLUDED.computed_at;
  `;
  await pool.query(query, [
    scoreResult.username,
    scoreResult.overallScore,
    JSON.stringify(scoreResult.subScores),
    JSON.stringify(scoreResult.insights || []),
    JSON.stringify(scoreResult.antiGamingFlags || []),
    scoreResult.meta.mode || 'public',
    scoreResult.meta.computedAt || new Date().toISOString(),
  ]);
}

export async function savePrivateScore(userId: string, scoreResult: any): Promise<void> {
  await ensureDatabase();
  const query = `
    INSERT INTO private_scores (user_id, overall_score, sub_scores, insights, anti_gaming_flags, data_source_mode, computed_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (user_id)
    DO UPDATE SET
      overall_score = EXCLUDED.overall_score,
      sub_scores = EXCLUDED.sub_scores,
      insights = EXCLUDED.insights,
      anti_gaming_flags = EXCLUDED.anti_gaming_flags,
      data_source_mode = EXCLUDED.data_source_mode,
      computed_at = EXCLUDED.computed_at;
  `;
  await pool.query(query, [
    userId,
    scoreResult.overallScore,
    JSON.stringify(scoreResult.subScores),
    JSON.stringify(scoreResult.insights || []),
    JSON.stringify(scoreResult.antiGamingFlags || []),
    'private-inclusive',
    scoreResult.meta.computedAt || new Date().toISOString(),
  ]);
}

export async function recordScoreSnapshot(
  username: string,
  userId: string | null,
  scoreType: 'public' | 'private-inclusive',
  overallScore: number,
  subScores: any
): Promise<void> {
  await ensureDatabase();
  const query = `
    INSERT INTO score_history (username, user_id, score_type, overall_score, sub_scores, recorded_at)
    VALUES ($1, $2, $3, $4, $5, NOW());
  `;
  await pool.query(query, [
    username,
    userId,
    scoreType,
    overallScore,
    JSON.stringify(subScores),
  ]);
}

export async function getScoreSnapshots(
  username: string,
  scoreType: 'public' | 'private-inclusive'
): Promise<any[]> {
  await ensureDatabase();
  const query = `
    SELECT id, username, score_type as "scoreType", overall_score as "overallScore", sub_scores as "subScores", recorded_at as "recordedAt"
    FROM score_history
    WHERE LOWER(username) = LOWER($1) AND score_type = $2
    ORDER BY recorded_at ASC
    LIMIT 30;
  `;
  const result = await pool.query(query, [username, scoreType]);
  return result.rows.map((row: any) => ({
    id: row.id,
    username: row.username,
    scoreType: row.scoreType,
    overallScore: Number(row.overallScore),
    subScores: row.subScores,
    recordedAt: row.recordedAt.toISOString(),
  }));
}
