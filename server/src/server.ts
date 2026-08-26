import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { runMigrations } from './db/migrate';
import { checkDbConnection } from './db/pool';

const PORT = process.env.PORT || 5000;

async function startServer() {
  console.log('🚀 Initializing DevRep Backend Engine...');

  // Attempt database migrations if connection is available
  try {
    const isDbAlive = await checkDbConnection();
    if (isDbAlive) {
      console.log('📦 PostgreSQL connected. Running migrations...');
      const migResult = await runMigrations();
      console.log(`✅ Migrations completed (${migResult.applied.length} applied).`);
    } else {
      console.warn('⚠️ PostgreSQL connection not active. App running in resilient memory/demo mode.');
    }
  } catch (err: any) {
    console.warn('⚠️ Database migration check skipped:', err.message);
  }

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`✨ DevRep API Server running at http://localhost:${PORT}`);
    console.log(`   - Public API:   http://localhost:${PORT}/api/public/:username`);
    console.log(`   - Private API:  http://localhost:${PORT}/api/me/score`);
    console.log(`   - GitHub Auth:  http://localhost:${PORT}/auth/github`);
  });
}

startServer();
