const fs = require("fs");
const path = require("path");
const db = require("./index");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

const ensureMigrationsTable = async (client) => {
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  );
};

const listMigrations = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
};

const getAppliedMigrations = async (client) => {
  const result = await client.query("SELECT id FROM schema_migrations");
  return new Set(result.rows.map((row) => row.id));
};

const runMigration = async (client, id, sql) => {
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [id]);
    await client.query("COMMIT");
    console.log(`Applied migration: ${id}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

const migrate = async () => {
  const client = await db.getClient();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const files = listMigrations();

    if (files.length === 0) {
      console.log("No migrations found.");
      return;
    }

    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8").trim();
      if (!sql) {
        console.log(`Skipping empty migration: ${file}`);
        continue;
      }
      await runMigration(client, file, sql);
    }
  } finally {
    client.release();
  }
};

module.exports = {
  migrate,
};
