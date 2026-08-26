"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserById = findUserById;
exports.findUserByGithubId = findUserByGithubId;
exports.findUserByUsername = findUserByUsername;
exports.upsertUser = upsertUser;
exports.getUserEncryptedToken = getUserEncryptedToken;
const pool_1 = require("../pool");
/**
 * Finds user by internal DB primary key.
 * Parameterized query: prevents SQL injection.
 */
async function findUserById(id) {
    const res = await (0, pool_1.query)('SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
}
/**
 * Finds user by GitHub numeric ID string.
 */
async function findUserByGithubId(githubId) {
    const res = await (0, pool_1.query)('SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE github_id = $1', [githubId]);
    return res.rows[0] || null;
}
/**
 * Finds user by GitHub handle (case-insensitive).
 */
async function findUserByUsername(username) {
    const res = await (0, pool_1.query)('SELECT id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return res.rows[0] || null;
}
/**
 * Upserts a GitHub user on OAuth login or token refresh.
 * Safely writes AES-256-GCM encrypted token.
 */
async function upsertUser(githubId, username, avatarUrl, encryptedToken) {
    const res = await (0, pool_1.query)(`
    INSERT INTO users (github_id, username, avatar_url, encrypted_oauth_token, updated_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (github_id) DO UPDATE SET
      username = EXCLUDED.username,
      avatar_url = EXCLUDED.avatar_url,
      encrypted_oauth_token = COALESCE(EXCLUDED.encrypted_oauth_token, users.encrypted_oauth_token),
      updated_at = CURRENT_TIMESTAMP
    RETURNING id, github_id, username, avatar_url, encrypted_oauth_token, created_at, updated_at
    `, [githubId, username, avatarUrl, encryptedToken || null]);
    return res.rows[0];
}
/**
 * Retrieves the encrypted OAuth token for a user.
 * SECURITY NOTE: Internal DAL only; never return to client or public endpoint.
 */
async function getUserEncryptedToken(userId) {
    const res = await (0, pool_1.query)('SELECT encrypted_oauth_token FROM users WHERE id = $1', [userId]);
    return res.rows[0]?.encrypted_oauth_token || null;
}
