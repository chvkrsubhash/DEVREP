import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export async function runMigrations(): Promise<{ applied: string[]; skipped: string[] }> {
  const client = await pool.connect();
  const applied: string[] = [];
  const skipped: string[] = [];

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
    const appliedSet = new Set(res.rows.map((r: { version: string }) => r.version));

    // 3. Read migration files
    const migrationsDir = path.resolve(__dirname, '../../db/migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log(`[Migrations] Directory not found: ${migrationsDir}`);
      return { applied, skipped };
    }

    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      if (appliedSet.has(file)) {
        skipped.push(file);
        continue;
      }

      console.log(`[Migrations] Running migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied.push(file);
        console.log(`[Migrations] Applied ${file} successfully.`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[Migrations] Migration failed on ${file}:`, err);
        throw err;
      }
    }

    return { applied, skipped };
  } finally {
    client.release();
  }
}
