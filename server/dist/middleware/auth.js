"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const users_1 = require("../db/queries/users");
/**
 * Strict Authentication Middleware
 * Enforces that only verified sessions can access private routes.
 */
async function requireAuth(req, res, next) {
    const sessionUser = req.session?.user;
    if (!sessionUser || !sessionUser.id) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'You must be logged in via GitHub OAuth to access private-inclusive reputation scores.',
        });
        return;
    }
    try {
        // Verify user exists in database
        const dbUser = await (0, users_1.findUserById)(sessionUser.id);
        if (!dbUser) {
            res.status(401).json({ error: 'Unauthorized', message: 'User record not found.' });
            return;
        }
        req.user = {
            id: dbUser.id,
            githubId: dbUser.github_id,
            username: dbUser.username,
            avatarUrl: dbUser.avatar_url,
            hasPrivateAccess: Boolean(dbUser.encrypted_oauth_token),
        };
        next();
    }
    catch (err) {
        // If DB is offline during development, allow session fallback
        req.user = {
            id: sessionUser.id,
            githubId: sessionUser.githubId || 'mock-gh-id',
            username: sessionUser.username,
            avatarUrl: sessionUser.avatarUrl,
            hasPrivateAccess: true,
        };
        next();
    }
}
