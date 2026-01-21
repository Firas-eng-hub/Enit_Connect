const db = require("../db");

const createVersion = async (data) => {
  const result = await db.query(
    `INSERT INTO document_versions (
      document_id, version, link, extension, mime_type, size, size_bytes, created_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7, now(), $8)
    RETURNING *`,
    [
      data.documentId,
      data.version,
      data.link,
      data.extension || null,
      data.mimeType || null,
      data.size || null,
      data.sizeBytes || null,
      JSON.stringify(data.extra || {}),
    ]
  );
  return result.rows[0];
};

const listByDocumentId = async (documentId) => {
  const result = await db.query(
    `SELECT * FROM document_versions WHERE document_id = $1 ORDER BY version DESC`,
    [documentId]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query(`SELECT * FROM document_versions WHERE id = $1`, [id]);
  return result.rows[0] || null;
};

module.exports = {
  createVersion,
  listByDocumentId,
  findById,
};
