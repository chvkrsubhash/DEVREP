import { runMigrations } from './migrate';
import { pool } from './pool';

async function main() {
  console.log('🔄 DevRep Database Migration Runner Starting...');
  try {
    const result = await runMigrations();
    console.log(`✅ Migrations completed: ${result.applied.length} applied, ${result.skipped.length} up-to-date.`);
  } catch (err: any) {
    console.error('❌ Migration runner failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
