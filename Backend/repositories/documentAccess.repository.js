const db = require("../db");
const { parseJson } = require("../utils/validation");

const resolveUserTypeById = async (userId) => {
  const result = await db.query(
    `SELECT user_type FROM (
       SELECT 'admin'::text AS user_type WHERE EXISTS (SELECT 1 FROM admins WHERE id = $1)
       UNION ALL
       SELECT 'student'::text AS user_type WHERE EXISTS (SELECT 1 FROM students WHERE id = $1)
       UNION ALL
       SELECT 'company'::text AS user_type WHERE EXISTS (SELECT 1 FROM companies WHERE id = $1)
     ) t
     LIMIT 1`,
    [userId]
  );
  return result.rows[0]?.user_type || null;
};

const createAccessEntries = async (entries) => {
  if (!entries.length) return [];
  const values = [];
  const params = [];
  let idx = 1;

  entries.forEach((entry) => {
    values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, now())`);
    params.push(entry.documentId, entry.userId, entry.userType, entry.access || "view");
    idx += 4;
  });

  const result = await db.query(
    `INSERT INTO document_access (document_id, user_id, user_type, access, created_at)
     VALUES ${values.join(", ")}
     ON CONFLICT (document_id, user_id, user_type) DO NOTHING
     RETURNING *`,
    params
  );
  return result.rows;
};

const listSharedDocumentsByUser = async ({ userId, userType }) => {
  const result = await db.query(
    `SELECT d.*
     FROM document_access da
     JOIN documents d ON d.id = da.document_id
     WHERE da.user_id = $1 AND da.user_type = $2
     ORDER BY d.created_at DESC NULLS LAST`,
    [userId, userType]
  );
  return result.rows.map((row) => ({
    ...row,
    extra: parseJson(row.extra, {}),
  }));
};

const deleteByDocumentId = async (documentId) => {
  const result = await db.query("DELETE FROM document_access WHERE document_id = $1", [documentId]);
  return result.rowCount > 0;
};

module.exports = {
  createAccessEntries,
  listSharedDocumentsByUser,
  deleteByDocumentId,
  resolveUserTypeById,
};
