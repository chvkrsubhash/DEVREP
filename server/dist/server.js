"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = require("./app");
const migrate_1 = require("./db/migrate");
const pool_1 = require("./db/pool");
const PORT = process.env.PORT || 5000;
async function startServer() {
    console.log('🚀 Initializing DevRep Backend Engine...');
    // Attempt database migrations if connection is available
    try {
        const isDbAlive = await (0, pool_1.checkDbConnection)();
        if (isDbAlive) {
            console.log('📦 PostgreSQL connected. Running migrations...');
            const migResult = await (0, migrate_1.runMigrations)();
            console.log(`✅ Migrations completed (${migResult.applied.length} applied).`);
        }
        else {
            console.warn('⚠️ PostgreSQL connection not active. App running in resilient memory/demo mode.');
        }
    }
    catch (err) {
        console.warn('⚠️ Database migration check skipped:', err.message);
    }
    const app = (0, app_1.createApp)();
    app.listen(PORT, () => {
        console.log(`✨ DevRep API Server running at http://localhost:${PORT}`);
        console.log(`   - Public API:   http://localhost:${PORT}/api/public/:username`);
        console.log(`   - Private API:  http://localhost:${PORT}/api/me/score`);
        console.log(`   - GitHub Auth:  http://localhost:${PORT}/auth/github`);
    });
}
startServer();
