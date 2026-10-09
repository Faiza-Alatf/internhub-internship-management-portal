const app = require('./app');
const env = require('./config/env');
const { getPool } = require('./config/db');

(async () => {
  try {
    await getPool();
    console.log(`[db] Connected to SQL Server database "${env.db.database}"`);
  } catch (err) {
    console.error('\n[db] Could not connect to SQL Server:', err.message);
    console.error('     Check server/.env (DB_SERVER, DB_USER, DB_PASSWORD, DB_INSTANCE) and see README > Common errors.\n');
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`[api] Server running on http://localhost:${env.port}`));
})();
