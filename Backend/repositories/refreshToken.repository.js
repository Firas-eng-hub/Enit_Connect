const db = require("../db");
const { randomBytes } = require("crypto");

const createToken = async (userId, userType) => {
  const token = randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.query(
    `INSERT INTO refresh_tokens (
      token, user_id, user_type, expires_at, created_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6)`,
    [token, userId, userType, expiresAt, new Date(), JSON.stringify({})]
  );

  return token;
};

const findByToken = async (token) => {
  const result = await db.query("SELECT * FROM refresh_tokens WHERE token = $1", [token]);
  return result.rows[0] || null;
};

const deleteByToken = async (token) => {
  const result = await db.query("DELETE FROM refresh_tokens WHERE token = $1", [token]);
  return result.rowCount > 0;
};

const deleteById = async (id) => {
  const result = await db.query("DELETE FROM refresh_tokens WHERE id = $1", [id]);
  return result.rowCount > 0;
};

// Atomically mark a token as rotated. Returns the row only for the first caller.
const markRotated = async (token) => {
  const result = await db.query(
    `UPDATE refresh_tokens
        SET extra = COALESCE(extra, '{}'::jsonb) || jsonb_build_object('rotated_at', now())
      WHERE token = $1 AND NOT (COALESCE(extra, '{}'::jsonb) ? 'rotated_at')
      RETURNING *`,
    [token]
  );
  return result.rows[0] || null;
};

// Revoke every refresh token of a user (used on token-reuse detection).
const deleteByUser = async (userId) => {
  const result = await db.query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId]);
  return result.rowCount;
};

module.exports = {
  createToken,
  markRotated,
  deleteByUser,
  findByToken,
  deleteByToken,
  deleteById,
};
