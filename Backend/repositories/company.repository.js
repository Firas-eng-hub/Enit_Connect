const db = require("../db");
const { escapeLike } = require("../utils/sql");

// List/search columns: never password, confirmation codes or `extra`.
const LIST_COLUMNS = `id, name, email, status, country, city, address, phone, website, logo, about,
  latitude, longitude, created_at`;
const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createCompany = async (data) => {
  const result = await db.query(
    `INSERT INTO companies (
      status, confirmation_code, verification_expires_at, verification_attempts, name, email, password, website,
      address, city, country, phone, about, logo, latitude, longitude, created_at, updated_at, extra
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,$7,
      $8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
    )
    RETURNING *`,
    [
      data.status || "Active",
      data.confirmationCode || null,
      data.verificationExpiresAt || null,
      data.verificationAttempts || 0,
      data.name,
      data.email,
      data.password,
      data.website,
      data.address,
      data.city,
      data.country,
      data.phone,
      data.about || null,
      data.logo || null,
      data.latitude || null,
      data.longitude || null,
      data.createdAt || new Date(),
      data.updatedAt || null,
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query("SELECT * FROM companies WHERE LOWER(email) = LOWER($1)", [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM companies WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const findByName = async (name) => {
  const result = await db.query("SELECT * FROM companies WHERE LOWER(name) = LOWER($1)", [name]);
  return result.rows[0] || null;
};

const findByConfirmationCode = async (code) => {
  const result = await db.query("SELECT * FROM companies WHERE confirmation_code = $1", [code]);
  return result.rows[0] || null;
};

const listPage = async ({ limit = 200, offset = 0, activeOnly = false } = {}) => {
  const result = await db.query(
    `SELECT ${LIST_COLUMNS} FROM companies ${activeOnly ? "WHERE status = 'Active'" : ""}
     ORDER BY created_at DESC NULLS LAST LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

/** Fuzzy company-name search via pg_trgm (companies_name_trgm_idx). */
const searchByName = async (query, { limit = 20, activeOnly = true } = {}) => {
  const q = String(query).trim();
  const result = await db.query(
    `SELECT ${LIST_COLUMNS}
     FROM companies
     WHERE (name % $1 OR name ILIKE $2) ${activeOnly ? "AND status = 'Active'" : ""}
     ORDER BY similarity(name, $1) DESC, id
     LIMIT $3`,
    [q, `%${escapeLike(q)}%`, limit]
  );
  return result.rows;
};

const listForStudentBrowse = async ({ query = "", limit = 50, offset = 0 } = {}) => {
  const normalizedQuery = String(query || "").trim();
  const pattern = `%${normalizedQuery}%`;

  const [countResult, rowsResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM companies
       WHERE status = 'Active'
         AND ($1::text = '' OR name ILIKE $2 OR email ILIKE $2)`,
      [normalizedQuery, pattern]
    ),
    db.query(
      `SELECT id, name, email, logo
       FROM companies
       WHERE status = 'Active'
         AND ($1::text = '' OR name ILIKE $2 OR email ILIKE $2)
       ORDER BY created_at DESC NULLS LAST
       LIMIT $3
       OFFSET $4`,
      [normalizedQuery, pattern, limit, offset]
    ),
  ]);

  return {
    rows: rowsResult.rows,
    total: Number(countResult.rows[0]?.total || 0),
  };
};

const listIds = async () => {
  const result = await db.query("SELECT id FROM companies");
  return result.rows.map((row) => row.id);
};

// `column` must come from a caller-side allowlist (pickAllowed).
const searchByKey = async (column, key, { limit = 50, offset = 0, activeOnly = false } = {}) => {
  const result = await db.query(
    `SELECT ${LIST_COLUMNS} FROM companies
     WHERE ${column} ILIKE $1 ${activeOnly ? "AND status = 'Active'" : ""}
     ORDER BY created_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [`${escapeLike(key)}%`, limit, offset]
  );
  return result.rows;
};

const updateCompany = async (id, data) => {
  const result = await db.query(
    `UPDATE companies
     SET status = COALESCE($1, status),
         name = COALESCE($2, name),
         email = COALESCE($3, email),
         country = COALESCE($4, country),
         city = COALESCE($5, city),
         address = COALESCE($6, address),
         phone = COALESCE($7, phone),
         website = COALESCE($8, website),
         logo = COALESCE($9, logo),
         about = COALESCE($10, about),
         updated_at = now()
     WHERE id = $11
     RETURNING *`,
    [
      data.status || "Active",
      data.name || null,
      data.email || null,
      data.country || null,
      data.city || null,
      data.address || null,
      data.phone || null,
      data.website || null,
      data.logo || null,
      data.about || null,
      id,
    ]
  );
  return result.rows[0] || null;
};

const updateConfirmationCodeByEmail = async (email, confirmationCode, expiresAt) => {
  const result = await db.query(
    `UPDATE companies
     SET confirmation_code = $1,
         verification_expires_at = $2,
         verification_attempts = 0,
         status = CASE WHEN status = 'Active' THEN status ELSE 'Pending' END,
         updated_at = now()
     WHERE LOWER(email) = LOWER($3)
       AND status <> 'Active'
     RETURNING *`,
    [confirmationCode, expiresAt || null, email]
  );
  return result.rows[0] || null;
};

const incrementVerificationAttempts = async (id) => {
  const result = await db.query(
    `UPDATE companies
     SET verification_attempts = COALESCE(verification_attempts, 0) + 1,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updateLogo = async (id, logo) => {
  const result = await db.query(
    `UPDATE companies
     SET logo = $1, status = 'Active', updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [logo, id]
  );
  return result.rows[0] || null;
};

const verifyCompany = async (id) => {
  const result = await db.query(
    `UPDATE companies
     SET status = 'Active',
         confirmation_code = NULL,
         verification_expires_at = NULL,
         verification_attempts = 0,
         updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updateExtra = async (id, extra) => {
  const result = await db.query(
    `UPDATE companies
     SET extra = $1::jsonb,
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [toJson(extra || {}, {}), id]
  );
  return result.rows[0] || null;
};

const deleteCompany = async (id) => {
  const result = await db.query("DELETE FROM companies WHERE id = $1", [id]);
  return result.rowCount > 0;
};

const findByIds = async (ids) => {
  if (!ids.length) return [];
  const result = await db.query(
    "SELECT * FROM companies WHERE id = ANY($1::uuid[])",
    [ids]
  );
  return result.rows;
};

module.exports = {
  createCompany,
  findByEmail,
  findById,
  findByName,
  findByConfirmationCode,
  listPage,
  listForStudentBrowse,
  listIds,
  searchByKey,
  searchByName,
  updateCompany,
  updateConfirmationCodeByEmail,
  incrementVerificationAttempts,
  updateLogo,
  verifyCompany,
  updateExtra,
  deleteCompany,
  findByIds,
};
