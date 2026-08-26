-- Migration 001: Initial DevRep Database Schema
-- Uses raw PostgreSQL data types with parameterized index structures

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    github_id VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(120) NOT NULL,
    avatar_url TEXT,
    encrypted_oauth_token TEXT, -- Stored as AES-256-GCM ciphertext:iv:authTag
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);

-- PUBLIC SCORES: Cached public reputation calculations for any GitHub username
-- No private repo metrics or user tokens are ever referenced here.
CREATE TABLE IF NOT EXISTS public_scores (
    id SERIAL PRIMARY KEY,
    username VARCHAR(120) UNIQUE NOT NULL,
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    tier VARCHAR(64) NOT NULL,
    tier_description TEXT,
    sub_scores JSONB NOT NULL,
    breakdown JSONB NOT NULL,
    anti_gaming JSONB NOT NULL,
    meta JSONB NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_public_scores_username ON public_scores(LOWER(username));
CREATE INDEX IF NOT EXISTS idx_public_scores_computed_at ON public_scores(computed_at);

-- PRIVATE SCORES: Authenticated self-only evaluations with private repository scope.
-- STRICT SECURITY BOUNDARY: ONLY queried in authenticated /api/me/score routes.
CREATE TABLE IF NOT EXISTS private_scores (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    tier VARCHAR(64) NOT NULL,
    tier_description TEXT,
    sub_scores JSONB NOT NULL,
    breakdown JSONB NOT NULL,
    anti_gaming JSONB NOT NULL,
    meta JSONB NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_private_scores_user_id ON private_scores(user_id);

-- SCORE SNAPSHOTS: Historical tracking over time for trajectory visualizations
CREATE TABLE IF NOT EXISTS score_snapshots (
    id SERIAL PRIMARY KEY,
    username VARCHAR(120) NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    data_mode VARCHAR(32) NOT NULL CHECK (data_mode IN ('public', 'private-inclusive')),
    overall_score INT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    sub_scores JSONB NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_mode ON score_snapshots(LOWER(username), data_mode, computed_at DESC);
