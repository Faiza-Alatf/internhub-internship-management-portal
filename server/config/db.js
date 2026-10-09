// SQL Server connection pool + small helpers used by every controller.
// All queries use parameters (@name) so user input can never alter the SQL (prevents SQL injection).
const sql = require('mssql');
const env = require('./env');

const config = {
  server: env.db.server,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  connectionTimeout: 15000,
  requestTimeout: 30000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: env.db.encrypt, trustServerCertificate: env.db.trustServerCertificate },
};
// Named instance (e.g. SQLEXPRESS) OR a fixed port - tedious does not allow both
if (env.db.instance) config.options.instanceName = env.db.instance;
else config.port = env.db.port;

let poolPromise = null;

function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = null; // allow a retry on the next request
      throw err;
    });
  }
  return poolPromise;
}

// Converts column names like "InternId" to "internId" so JSON looks natural in JavaScript
const camelCaseRows = (rows = []) =>
  rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([key, value]) => [key.charAt(0).toLowerCase() + key.slice(1), value]))
  );

async function execute(request, text, params) {
  for (const [name, value] of Object.entries(params)) request.input(name, value === undefined ? null : value);
  const result = await request.query(text);
  return camelCaseRows(result.recordset);
}

// Run one parameterised query:  await query('SELECT * FROM Users WHERE UserId=@id', { id: 1 })
async function query(text, params = {}) {
  const pool = await getPool();
  return execute(pool.request(), text, params);
}

// Run several queries atomically. If anything throws, everything is rolled back.
async function withTransaction(work) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  const run = (text, params = {}) => execute(new sql.Request(transaction), text, params);
  try {
    const result = await work(run);
    await transaction.commit();
    return result;
  } catch (err) {
    try { await transaction.rollback(); } catch (_) { /* already rolled back */ }
    throw err;
  }
}

module.exports = { sql, getPool, query, withTransaction };
