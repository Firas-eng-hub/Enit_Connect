/**
 * Database Test Helper using pg-mem
 * Provides in-memory PostgreSQL instance for unit tests
 */

const { newDb } = require('pg-mem');
const fs = require('fs');
const path = require('path');

let db = null;
let pool = null;

/**
 * Initialize in-memory database with schema
 * @returns {Promise<Object>} Database connection pool
 */
async function initializeTestDb() {
  // Create a fresh in-memory database for each test suite
  db = newDb({
    autoCreateForeignKeyConstraints: true,
  });

  // Read and execute schema
  const schemaPath = path.join(__dirname, '../../db/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split and execute schema statements
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      db.public.query(statement);
    } catch (err) {
      // Some schema statements may not be compatible with pg-mem
      // Log and continue
      console.debug(`Schema execution warning: ${err.message}`);
    }
  }

  // Create a fake pool interface compatible with pg package
  pool = {
    query: (text, values) => {
      try {
        const result = db.public.query(text, values);
        return Promise.resolve(result);
      } catch (err) {
        return Promise.reject(err);
      }
    },
    end: () => Promise.resolve(),
  };

  return pool;
}

/**
 * Reset database to clean state (for test isolation)
 * @returns {Promise<void>}
 */
async function resetTestDb() {
  if (!db) return;

  // Get all table names
  const result = db.public.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );

  // Drop all tables in reverse order to avoid FK constraints
  const tables = result.rows.map(r => r.table_name).reverse();
  for (const table of tables) {
    try {
      db.public.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    } catch (err) {
      console.debug(`Drop table warning: ${err.message}`);
    }
  }

  // Reinitialize schema
  await initializeTestDb();
}

/**
 * Seed test data
 * @param {string} table - Table name
 * @param {Array<Object>} rows - Row data to insert
 * @returns {Promise<void>}
 */
async function seedTestData(table, rows) {
  if (!pool) throw new Error('Test database not initialized');

  for (const row of rows) {
    const keys = Object.keys(row);
    const values = Object.values(row);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const query = `INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(', ')}) 
                   VALUES (${placeholders})`;

    await pool.query(query, values);
  }
}

/**
 * Clean up test database
 * @returns {Promise<void>}
 */
async function closeTestDb() {
  if (pool) {
    await pool.end();
  }
  db = null;
  pool = null;
}

module.exports = {
  initializeTestDb,
  resetTestDb,
  seedTestData,
  closeTestDb,
  getPool: () => pool,
  getDb: () => db,
};
