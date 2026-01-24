const db = require("../db");

const formatShareAccess = ({ access, audience }) => {
  const base = access || "view";
  if (!audience) return base;
  return `${base}:${audience}`;
};

const parseShareAccess = (value) => {
  const raw = String(value || "");
  const [access, audience] = raw.split(":");
  return { access: access || "view", audience: audience || null };
};

const createShare = async (data) => {
  const accessValue = formatShareAccess({
    access: data.access || "view",
    audience: data.audience || null,
  });

  // Allow callers to control the share `id` (e.g., when using it as the share token).
  if (data.id) {
    const result = await db.query(
      `INSERT INTO document_shares (
        id, document_id, token_hash, expires_at, password_hash, access, created_by, created_by_type, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
      RETURNING *`,
      [
        data.id,
        data.documentId,
        data.tokenHash,
        data.expiresAt || null,
        data.passwordHash || null,
        accessValue,
        data.createdBy || null,
        data.createdByType || null,
      ]
    );
    return result.rows[0];
  }

  const result = await db.query(
    `INSERT INTO document_shares (
      document_id, token_hash, expires_at, password_hash, access, created_by, created_by_type, created_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7, now())
    RETURNING *`,
    [
      data.documentId,
      data.tokenHash,
      data.expiresAt || null,
      data.passwordHash || null,
      accessValue,
      data.createdBy || null,
      data.createdByType || null,
    ]
  );
  return result.rows[0];
};

const listByDocumentId = async (documentId) => {
  const result = await db.query(
    `SELECT * FROM document_shares WHERE document_id = $1 ORDER BY created_at DESC`,
    [documentId]
  );
  return result.rows;
};

const findByTokenHash = async (tokenHash) => {
  const result = await db.query(
    `SELECT * FROM document_shares WHERE token_hash = $1`,
    [tokenHash]
  );
  return result.rows[0] || null;
};

const revokeShare = async (shareId) => {
  const result = await db.query(
    `UPDATE document_shares SET revoked_at = now() WHERE id = $1 RETURNING *`,
    [shareId]
  );
  return result.rows[0] || null;
};

const deleteByDocumentId = async (documentId) => {
  const result = await db.query("DELETE FROM document_shares WHERE document_id = $1", [documentId]);
  return result.rowCount > 0;
};

module.exports = {
  createShare,
  listByDocumentId,
  findByTokenHash,
  revokeShare,
  deleteByDocumentId,
  parseShareAccess,
  formatShareAccess,
};
