import { Pool, QueryResult, QueryResultRow } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/devrep';

const isSslNeeded = connectionString.includes('sslmode=require') || connectionString.includes('neon.tech') || connectionString.includes('aws');

export const pool = new Pool({
  connectionString,
  ssl: isSslNeeded ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

let isConnected = false;

pool.on('connect', () => {
  isConnected = true;
});

pool.on('error', (err) => {
  console.warn('⚠️ [Postgres Pool Warning]:', err.message);
});

/**
 * Clean data-access layer query wrapper.
 * Enforces parameterized queries and standard error handling.
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'test' && process.env.DEBUG_SQL) {
      console.log('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (err: any) {
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
export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
