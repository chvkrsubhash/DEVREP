"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const migrate_1 = require("./migrate");
const pool_1 = require("./pool");
async function main() {
    console.log('🔄 DevRep Database Migration Runner Starting...');
    try {
        const result = await (0, migrate_1.runMigrations)();
        console.log(`✅ Migrations completed: ${result.applied.length} applied, ${result.skipped.length} up-to-date.`);
    }
    catch (err) {
        console.error('❌ Migration runner failed:', err.message);
        process.exit(1);
    }
    finally {
        await pool_1.pool.end();
    }
}
main();
