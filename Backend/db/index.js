const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: Number(process.env.PG_POOL_IDLE || 30000),
  connectionTimeoutMillis: Number(process.env.PG_POOL_TIMEOUT || 2000),
});

pool.on("error", (err) => {
  console.error("Postgres pool error:", err);
});

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

const withTransaction = async (fn) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const checkConnection = async () => {
  await query("SELECT 1");
};

module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
  checkConnection,
};
