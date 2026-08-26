"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicScore = getPublicScore;
exports.savePublicScore = savePublicScore;
exports.getPrivateScore = getPrivateScore;
exports.savePrivateScore = savePrivateScore;
exports.recordScoreSnapshot = recordScoreSnapshot;
exports.getScoreSnapshots = getScoreSnapshots;
const pool_1 = require("../pool");
/* =========================================================================
 * PUBLIC SCORES DAL
 * AUDIT BOUNDARY: Queries here MUST ONLY operate on public data.
 * No private repository metrics or authenticated user tokens can leak here.
 * ========================================================================= */
async function getPublicScore(username) {
    const res = await (0, pool_1.query)(`SELECT username, overall_score, tier, tier_description, sub_scores, breakdown, anti_gaming, meta, computed_at
     FROM public_scores
     WHERE LOWER(username) = LOWER($1)`, [username]);
    const row = res.rows[0];
    if (!row)
        return null;
    return {
        username: row.username,
        avatarUrl: row.meta?.avatarUrl || `https://github.com/${row.username}.png`,
        name: row.meta?.name,
        bio: row.meta?.bio,
        company: row.meta?.company,
        location: row.meta?.location,
        dataMode: 'public',
        overallScore: row.overall_score,
        tier: row.tier,
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
async function savePublicScore(score) {
    const metaWithProfile = {
        ...score.meta,
        avatarUrl: score.avatarUrl,
        name: score.name,
        bio: score.bio,
        company: score.company,
        location: score.location,
    };
    await (0, pool_1.query)(`
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
    `, [
        score.username,
        score.overallScore,
        score.tier,
        score.tierDescription,
        JSON.stringify(score.subScores),
        JSON.stringify(score.breakdown),
        JSON.stringify(score.antiGaming),
        JSON.stringify(metaWithProfile),
    ]);
}
/* =========================================================================
 * PRIVATE SCORES DAL
 * AUDIT BOUNDARY: Queries here are strictly isolated to authenticated self-user.
 * user_id is foreign-keyed to the users table and verified in auth middleware.
 * ========================================================================= */
async function getPrivateScore(userId) {
    const res = await (0, pool_1.query)(`SELECT p.user_id, p.overall_score, p.tier, p.tier_description, p.sub_scores, p.breakdown, p.anti_gaming, p.meta, p.computed_at, u.username
     FROM private_scores p
     JOIN users u ON u.id = p.user_id
     WHERE p.user_id = $1`, [userId]);
    const row = res.rows[0];
    if (!row)
        return null;
    return {
        username: row.username,
        avatarUrl: row.meta?.avatarUrl || `https://github.com/${row.username}.png`,
        name: row.meta?.name,
        bio: row.meta?.bio,
        company: row.meta?.company,
        location: row.meta?.location,
        dataMode: 'private-inclusive',
        overallScore: row.overall_score,
        tier: row.tier,
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
async function savePrivateScore(userId, score) {
    const metaWithProfile = {
        ...score.meta,
        avatarUrl: score.avatarUrl,
        name: score.name,
        bio: score.bio,
        company: score.company,
        location: score.location,
    };
    await (0, pool_1.query)(`
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
    `, [
        userId,
        score.overallScore,
        score.tier,
        score.tierDescription,
        JSON.stringify(score.subScores),
        JSON.stringify(score.breakdown),
        JSON.stringify(score.antiGaming),
        JSON.stringify(metaWithProfile),
    ]);
}
/* =========================================================================
 * SCORE SNAPSHOTS DAL
 * ========================================================================= */
async function recordScoreSnapshot(username, userId, dataMode, overallScore, subScores) {
    await (0, pool_1.query)(`
    INSERT INTO score_snapshots (username, user_id, data_mode, overall_score, sub_scores, computed_at)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
    `, [username, userId, dataMode, overallScore, JSON.stringify(subScores)]);
}
async function getScoreSnapshots(username, mode) {
    const res = await (0, pool_1.query)(`
    SELECT id, overall_score, sub_scores, data_mode, computed_at
    FROM score_snapshots
    WHERE LOWER(username) = LOWER($1) AND data_mode = $2
    ORDER BY computed_at ASC
    LIMIT 30
    `, [username, mode]);
    return res.rows.map(r => ({
        id: String(r.id),
        overallScore: r.overall_score,
        subScores: r.sub_scores,
        dataMode: r.data_mode,
        computedAt: new Date(r.computed_at).toISOString(),
    }));
}
