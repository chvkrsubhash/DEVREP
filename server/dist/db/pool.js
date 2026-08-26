"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.query = query;
exports.checkDbConnection = checkDbConnection;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devrep';
const isSslNeeded = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('aws');
exports.pool = new pg_1.Pool({
    connectionString,
    ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});
let isConnected = false;
exports.pool.on('connect', () => {
    isConnected = true;
});
exports.pool.on('error', (err) => {
    console.warn('⚠️ [Postgres Pool Warning]:', err.message);
});
/**
 * Clean data-access layer query wrapper.
 * Enforces parameterized queries and standard error handling.
 */
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await exports.pool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.NODE_ENV !== 'test' && process.env.DEBUG_SQL) {
            console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
        }
        return res;
    }
    catch (err) {
        // Graceful error logging
        if (process.env.NODE_ENV !== 'test') {
            console.warn(`[DB Error]: ${err.message} in query: ${text.slice(0, 80)}`);
        }
        throw err;
    }
}
/**
 * Checks if the PostgreSQL connection is active
 */
async function checkDbConnection() {
    try {
        await exports.pool.query('SELECT 1');
        return true;
    }
    catch {
        return false;
    }
}
