"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = require("./pool");
async function runMigrations() {
    const client = await pool_1.pool.connect();
    const applied = [];
    const skipped = [];
    try {
        // 1. Create schema_migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
        // 2. Fetch already applied versions
        const res = await client.query('SELECT version FROM schema_migrations');
        const appliedSet = new Set(res.rows.map((r) => r.version));
        // 3. Read migration files
        const migrationsDir = path_1.default.resolve(__dirname, '../../db/migrations');
        if (!fs_1.default.existsSync(migrationsDir)) {
            console.log(`[Migrations] Directory not found: ${migrationsDir}`);
            return { applied, skipped };
        }
        const files = fs_1.default.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
            if (appliedSet.has(file)) {
                skipped.push(file);
                continue;
            }
            console.log(`[Migrations] Running migration: ${file}...`);
            const sql = fs_1.default.readFileSync(path_1.default.join(migrationsDir, file), 'utf8');
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
                await client.query('COMMIT');
                applied.push(file);
                console.log(`[Migrations] Applied ${file} successfully.`);
            }
            catch (err) {
                await client.query('ROLLBACK');
                console.error(`[Migrations] Migration failed on ${file}:`, err);
                throw err;
            }
        }
        return { applied, skipped };
    }
    finally {
        client.release();
    }
}
