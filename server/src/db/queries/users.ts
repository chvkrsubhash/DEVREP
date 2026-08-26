import { query } from '../pool';

export interface DbUser {
  id: number;
  github_id: string;
  username: string;
  avatar_url: string | null;
  encrypted_oauth_token: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Finds user by internal DB primary key.
 * Parameterized query: prevents SQL injection.
 */
export async function findUserById(id: number): Promise<DbUser | null> {
  const res = await query<DbUser>(
    'SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
}

/**
 * Finds user by GitHub numeric ID string.
 */
export async function findUserByGithubId(githubId: string): Promise<DbUser | null> {
  const res = await query<DbUser>(
    'SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE github_id = $1',
    [githubId]
  );
  return res.rows[0] || null;
}

/**
 * Finds user by GitHub handle (case-insensitive).
 */
export async function findUserByUsername(username: string): Promise<DbUser | null> {
  const res = await query<DbUser>(
    'SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  return res.rows[0] || null;
}

/**
 * Upserts a GitHub user on OAuth login or token refresh.
 * Safely writes AES-256-GCM encrypted token.
 */
export async function upsertUser(
  githubId: string,
  username: string,
  avatarUrl: string,
  encryptedToken?: string | null
): Promise<DbUser> {
  const res = await query<DbUser>(
    `
    INSERT INTO users (github_id, username, avatar_url, encrypted_oauth_token, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (github_id) DO UPDATE SET
      username = EXCLUDED.username,
      avatar_url = EXCLUDED.avatar_url,
      encrypted_oauth_token = COALESCE(EXCLUDED.encrypted_oauth_token, users.encrypted_oauth_token),
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at
    `,
    [githubId, username, avatarUrl, encryptedToken || null]
  );
  return res.rows[0];
}

/**
 * Retrieves the encrypted OAuth token for a user.
 * SECURITY NOTE: Internal DAL only; never return to client or public endpoint.
 */
export async function getUserEncryptedToken(userId: number): Promise<string | null> {
  const res = await query<{ encrypted_oauth_token: string | null }>(
    'SELECT encrypted_oauth_token FROM users WHERE id = $1',
    [userId]
  );
  return res.rows[0]?.encrypted_oauth_token || null;
}
