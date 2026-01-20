const db = require("../db");
const createAdmin = async ({ email, password }) => {
  const result = await db.query(
    `INSERT INTO admins (email, password, created_at, extra)
     VALUES ($1, $2, now(), $3)
     RETURNING *`,
    [email, password, JSON.stringify({})]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query("SELECT * FROM admins WHERE LOWER(email) = LOWER($1)", [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM admins WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const listIds = async () => {
  const result = await db.query("SELECT id FROM admins");
  return result.rows.map((row) => row.id);
};

module.exports = {
  createAdmin,
  findByEmail,
  findById,
  listIds,
};
