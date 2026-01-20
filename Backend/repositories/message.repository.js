const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createMessage = async (data) => {
  const result = await db.query(
    `INSERT INTO messages (
      name, email, message, date, read, archived, created_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      data.name,
      data.email,
      data.message,
      data.date || new Date(),
      typeof data.read === "boolean" ? data.read : false,
      typeof data.archived === "boolean" ? data.archived : false,
      data.createdAt || new Date(),
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const listAll = async ({ includeArchived = false } = {}) => {
  const result = await db.query(
    `SELECT * FROM messages
     WHERE ($1::boolean = true OR archived = false)
     ORDER BY date DESC NULLS LAST`,
    [includeArchived]
  );
  return result.rows;
};

const markAllRead = async () => {
  await db.query("UPDATE messages SET read = true WHERE archived = false");
};

const markAllUnread = async () => {
  await db.query("UPDATE messages SET read = false WHERE archived = false");
};

const updateReadStatus = async (id, read) => {
  const result = await db.query(
    "UPDATE messages SET read = $1 WHERE id = $2 RETURNING *",
    [read, id]
  );
  return result.rows[0] || null;
};

const updateArchiveStatus = async (id, archived) => {
  const result = await db.query(
    "UPDATE messages SET archived = $1 WHERE id = $2 RETURNING *",
    [archived, id]
  );
  return result.rows[0] || null;
};

const bulkUpdate = async ({ ids, read, archived }) => {
  if (!ids.length) return [];
  const updates = [];
  const params = [];
  let idx = 1;

  if (typeof read === "boolean") {
    updates.push(`read = $${idx}`);
    params.push(read);
    idx += 1;
  }
  if (typeof archived === "boolean") {
    updates.push(`archived = $${idx}`);
    params.push(archived);
    idx += 1;
  }

  if (!updates.length) return [];

  params.push(ids);
  const result = await db.query(
    `UPDATE messages
     SET ${updates.join(", ")}
     WHERE id = ANY($${idx}::uuid[])
     RETURNING *`,
    params
  );
  return result.rows;
};

const countUnread = async () => {
  const result = await db.query(
    "SELECT COUNT(*) AS count FROM messages WHERE read = false AND archived = false"
  );
  return Number(result.rows[0]?.count || 0);
};

const deleteMessage = async (id) => {
  const result = await db.query("DELETE FROM messages WHERE id = $1", [id]);
  return result.rowCount > 0;
};

const mapMessageRow = (row) => ({
  _id: row.id,
  id: row.id,
  name: row.name,
  date: row.date,
  message: row.message,
  email: row.email,
  lu: row.read,
  read: row.read,
  archived: row.archived,
  extra: parseJson(row.extra, {}),
});

module.exports = {
  createMessage,
  listAll,
  markAllRead,
  markAllUnread,
  updateReadStatus,
  updateArchiveStatus,
  bulkUpdate,
  countUnread,
  deleteMessage,
  mapMessageRow,
};
