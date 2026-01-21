const db = require("../db");
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

const listAll = async () => {
  const result = await db.query("SELECT * FROM companies ORDER BY created_at DESC NULLS LAST");
  return result.rows;
};

const listIds = async () => {
  const result = await db.query("SELECT id FROM companies");
  return result.rows.map((row) => row.id);
};

const searchByKey = async (column, key) => {
  const result = await db.query(
    `SELECT * FROM companies WHERE ${column} ILIKE $1 ORDER BY created_at DESC NULLS LAST`,
    [`${key}%`]
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
  listAll,
  listIds,
  searchByKey,
  updateCompany,
  updateConfirmationCodeByEmail,
  incrementVerificationAttempts,
  updateLogo,
  verifyCompany,
  deleteCompany,
  findByIds,
};
