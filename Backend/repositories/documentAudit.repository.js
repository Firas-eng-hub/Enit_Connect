const db = require("../db");

const createLog = async (data) => {
  const result = await db.query(
    `INSERT INTO document_audit_logs (document_id, actor_id, actor_type, action, metadata, created_at)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      data.documentId || null,
      data.actorId || null,
      data.actorType || null,
      data.action,
      data.metadata || {},
      data.createdAt || new Date(),
    ]
  );
  return result.rows[0];
};

module.exports = {
  createLog,
};
