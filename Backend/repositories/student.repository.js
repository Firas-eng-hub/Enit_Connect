const db = require("../db");
const { escapeLike } = require("../utils/sql");

// Columns for list/search responses: everything the row mappers use, but never
// password, confirmation codes or the internal `extra` blob.
const LIST_COLUMNS = `id, firstname, lastname, email, status, country, city, address, phone, type,
  work_at, "class", promotion, linkedin, picture, aboutme, latitude, longitude, created_at`;

// Must match the expression of students_fullname_trgm_idx (migration 017).
const FULL_NAME = "(coalesce(firstname, '') || ' ' || coalesce(lastname, ''))";
const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createStudent = async (data) => {
  const result = await db.query(
    `INSERT INTO students (
      firstname, lastname, email, password, status, confirmation_code,
      verification_expires_at, verification_attempts,
      country, city, address, phone, type, work_at, class, promotion, linkedin,
      picture, aboutme, latitude, longitude, created_at, updated_at, extra
    )
    VALUES (
      $1,$2,$3,$4,$5,$6,
      $7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
      $17,$18,$19,$20,$21,$22,$23,$24
    )
    RETURNING *`,
    [
      data.firstname,
      data.lastname,
      data.email,
      data.password,
      data.status || "Pending",
      data.confirmationCode || null,
      data.verificationExpiresAt || null,
      data.verificationAttempts || 0,
      data.country || null,
      data.city || null,
      data.address || null,
      data.phone || null,
      data.type,
      data.workAt || null,
      data.class || null,
      data.promotion || null,
      data.linkedin || null,
      data.picture || null,
      data.aboutme || null,
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
  const result = await db.query("SELECT * FROM students WHERE LOWER(email) = LOWER($1)", [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM students WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const findByConfirmationCode = async (code) => {
  const result = await db.query("SELECT * FROM students WHERE confirmation_code = $1", [code]);
  return result.rows[0] || null;
};

const listPage = async ({ limit = 200, offset = 0 } = {}) => {
  const result = await db.query(
    `SELECT ${LIST_COLUMNS} FROM students ORDER BY created_at DESC NULLS LAST LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

const listIds = async () => {
  const result = await db.query("SELECT id FROM students");
  return result.rows.map((row) => row.id);
};

// `column` must come from a caller-side allowlist (pickAllowed).
const searchByKey = async (column, key, { limit = 50, offset = 0, activeOnly = false } = {}) => {
  const result = await db.query(
    `SELECT ${LIST_COLUMNS} FROM students
     WHERE ${column} ILIKE $1 ${activeOnly ? "AND status = 'Active'" : ""}
     ORDER BY created_at DESC NULLS LAST
     LIMIT $2 OFFSET $3`,
    [`${escapeLike(key)}%`, limit, offset]
  );
  return result.rows;
};

/** Fuzzy full-name search via pg_trgm (replaces the in-memory string-similarity scan). */
const searchByName = async (query, { limit = 20, activeOnly = true } = {}) => {
  const q = String(query).trim();
  const result = await db.query(
    `SELECT ${LIST_COLUMNS}
     FROM students
     WHERE (${FULL_NAME} % $1 OR ${FULL_NAME} ILIKE $2) ${activeOnly ? "AND status = 'Active'" : ""}
     ORDER BY similarity(${FULL_NAME}, $1) DESC, id
     LIMIT $3`,
    [q, `%${escapeLike(q)}%`, limit]
  );
  return result.rows;
};

const searchByFilters = async (
  { country, city, promotion, className },
  { limit = 50, offset = 0, activeOnly = false } = {}
) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (country) {
    conditions.push(`country ILIKE $${idx}`);
    params.push(`%${escapeLike(country)}%`);
    idx += 1;
  }
  if (city) {
    conditions.push(`city ILIKE $${idx}`);
    params.push(`%${escapeLike(city)}%`);
    idx += 1;
  }
  if (promotion) {
    conditions.push(`promotion ILIKE $${idx}`);
    params.push(`%${escapeLike(promotion)}%`);
    idx += 1;
  }
  if (className) {
    conditions.push(`\"class\" ILIKE $${idx}`);
    params.push(`%${escapeLike(className)}%`);
    idx += 1;
  }

  if (!conditions.length) return [];
  if (activeOnly) conditions.push("status = 'Active'");

  const result = await db.query(
    `SELECT ${LIST_COLUMNS} FROM students WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC NULLS LAST
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );
  return result.rows;
};

const updateStudent = async (id, data) => {
  const result = await db.query(
    `UPDATE students
     SET firstname = COALESCE($1, firstname),
         lastname = COALESCE($2, lastname),
         email = COALESCE($3, email),
         country = COALESCE($4, country),
         city = COALESCE($5, city),
         address = COALESCE($6, address),
         phone = COALESCE($7, phone),
         type = COALESCE($8, type),
         work_at = COALESCE($9, work_at),
         class = COALESCE($10, class),
         promotion = COALESCE($11, promotion),
         linkedin = COALESCE($12, linkedin),
         picture = COALESCE($13, picture),
         aboutme = COALESCE($14, aboutme),
         latitude = COALESCE($15, latitude),
         longitude = COALESCE($16, longitude),
         status = COALESCE($17, status),
         updated_at = now()
     WHERE id = $18
     RETURNING *`,
    [
      data.firstname || null,
      data.lastname || null,
      data.email || null,
      data.country || null,
      data.city || null,
      data.address || null,
      data.phone || null,
      data.type || null,
      data.workAt || null,
      data.class || null,
      data.promotion || null,
      data.linkedin || null,
      data.picture || null,
      data.aboutme || null,
      data.latitude || null,
      data.longitude || null,
      data.status || null,
      id,
    ]
  );
  return result.rows[0] || null;
};

const updateConfirmationCodeByEmail = async (email, confirmationCode, expiresAt) => {
  const result = await db.query(
    `UPDATE students
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
    `UPDATE students
     SET verification_attempts = COALESCE(verification_attempts, 0) + 1,
         updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updatePicture = async (id, picture) => {
  const result = await db.query(
    `UPDATE students
     SET picture = $1, status = 'Active', updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [picture, id]
  );
  return result.rows[0] || null;
};

const verifyStudent = async (id) => {
  const result = await db.query(
    `UPDATE students
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
    `UPDATE students
     SET extra = $1::jsonb,
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [toJson(extra || {}, {}), id]
  );
  return result.rows[0] || null;
};

const deleteStudent = async (id) => {
  const result = await db.query("DELETE FROM students WHERE id = $1", [id]);
  return result.rowCount > 0;
};

module.exports = {
  createStudent,
  findByEmail,
  findById,
  findByConfirmationCode,
  listPage,
  listIds,
  searchByKey,
  searchByName,
  searchByFilters,
  updateStudent,
  updateConfirmationCodeByEmail,
  incrementVerificationAttempts,
  updatePicture,
  verifyStudent,
  updateExtra,
  deleteStudent,
};
