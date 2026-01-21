const db = require("../db");

const createRequest = async (data) => {
  const result = await db.query(
    `INSERT INTO document_requests (
      requester_id, requester_type, target_id, target_type,
      title, message, status, due_date, created_at, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now(), now())
    RETURNING *`,
    [
      data.requesterId || null,
      data.requesterType,
      data.targetId || null,
      data.targetType,
      data.title,
      data.message || null,
      data.status || "open",
      data.dueDate || null,
    ]
  );
  return result.rows[0];
};

const listByTarget = async ({ targetId, targetType }) => {
  const result = await db.query(
    `SELECT * FROM document_requests
     WHERE target_id = $1 AND target_type = $2
     ORDER BY created_at DESC`,
    [targetId, targetType]
  );
  return result.rows;
};

const listByRequester = async ({ requesterId, requesterType }) => {
  const result = await db.query(
    `SELECT * FROM document_requests
     WHERE requester_id = $1 AND requester_type = $2
     ORDER BY created_at DESC`,
    [requesterId, requesterType]
  );
  return result.rows;
};

const updateStatus = async (id, status) => {
  const result = await db.query(
    `UPDATE document_requests
     SET status = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
};

module.exports = {
  createRequest,
  listByTarget,
  listByRequester,
  updateStatus,
};
