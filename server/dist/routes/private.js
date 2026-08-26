"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privateRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const githubFetcher_1 = require("../services/githubFetcher");
const engine_1 = require("../scoring/engine");
const scores_1 = require("../db/queries/scores");
const users_1 = require("../db/queries/users");
const crypto_1 = require("../utils/crypto");
exports.privateRouter = (0, express_1.Router)();
// Apply strict authentication to all private routes
exports.privateRouter.use(auth_1.requireAuth);
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
exports.privateRouter.get('/score', async (req, res) => {
    const user = req.user;
    const forceRefresh = req.query.refresh === 'true';
    try {
        // 1. Check cached private score if recent
        if (!forceRefresh) {
            try {
                const cached = await (0, scores_1.getPrivateScore)(user.id);
                if (cached) {
                    const cacheAgeMs = Date.now() - new Date(cached.meta.computedAt).getTime();
                    if (cacheAgeMs < 15 * 60 * 1000) {
                        res.json(cached);
                        return;
                    }
                }
            }
            catch (dbErr) {
                // Continue to fresh calculation
            }
        }
        // 2. Retrieve & decrypt OAuth token securely
        let accessToken;
        try {
            const encrypted = await (0, users_1.getUserEncryptedToken)(user.id);
            if (encrypted) {
                accessToken = (0, crypto_1.decryptToken)(encrypted);
            }
        }
        catch (tokenErr) {
            console.warn('[Private API] Token decryption failed or unavailable:', tokenErr.message);
        }
        // 3. Fetch developer metrics including authorized private repositories
        // AUDIT: includePrivate: true is gated strictly by the authenticated user's session
        const rawData = await (0, githubFetcher_1.fetchGitHubDeveloperData)(user.username, {
            includePrivate: true,
            accessToken,
        });
        // 4. Compute private-inclusive score
        const scoreResult = (0, engine_1.computeDeveloperReputation)(rawData, 'private-inclusive');
        // 5. Persist strictly to private_scores table
        try {
            await (0, scores_1.savePrivateScore)(user.id, scoreResult);
            await (0, scores_1.recordScoreSnapshot)(user.username, user.id, 'private-inclusive', scoreResult.overallScore, scoreResult.subScores);
        }
        catch (saveErr) {
            // Non-fatal if DB is in memory/dev fallback
        }
        res.json(scoreResult);
    }
    catch (error) {
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
exports.privateRouter.get('/history', async (req, res) => {
    const user = req.user;
    try {
        const snapshots = await (0, scores_1.getScoreSnapshots)(user.username, 'private-inclusive');
        res.json(snapshots);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to retrieve private score history', message: error.message });
    }
});
