const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const listByRecipient = async (recipientType, recipientId, limit) => {
  const params = [recipientType, recipientId];
  let sql =
    "SELECT * FROM notifications WHERE recipient_type = $1 AND recipient_id = $2 ORDER BY created_at DESC NULLS LAST";
  if (limit) {
    params.push(limit);
    sql += " LIMIT $3";
  }
  const result = await db.query(sql, params);
  return result.rows;
};

const countUnread = async (recipientType, recipientId) => {
  const result = await db.query(
    "SELECT COUNT(*) AS count FROM notifications WHERE recipient_type = $1 AND recipient_id = $2 AND read = false",
    [recipientType, recipientId]
  );
  return Number(result.rows[0]?.count || 0);
};

const markRead = async (id, recipientType, recipientId) => {
  const result = await db.query(
    "UPDATE notifications SET read = true, updated_at = now() WHERE id = $1 AND recipient_type = $2 AND recipient_id = $3 RETURNING *",
    [id, recipientType, recipientId]
  );
  const row = result.rows[0] || null;
  if (!row) {
    return { updated: false, deleted: false };
  }

  const extra = parseJson(row.extra, {});
  const shouldDelete =
    extra?.autoDeleteOnRead === true ||
    extra?.category === "mail";

  if (shouldDelete) {
    await db.query(
      "DELETE FROM notifications WHERE id = $1 AND recipient_type = $2 AND recipient_id = $3",
      [id, recipientType, recipientId]
    );
  }

  return { updated: true, deleted: shouldDelete };
};

const markAllRead = async (recipientType, recipientId) => {
  const updated = await db.query(
    "UPDATE notifications SET read = true WHERE recipient_type = $1 AND recipient_id = $2",
    [recipientType, recipientId]
  );
  const deleted = await db.query(
    `DELETE FROM notifications
     WHERE recipient_type = $1
       AND recipient_id = $2
       AND (
         extra->>'category' = 'mail'
         OR extra->>'autoDeleteOnRead' = 'true'
       )`,
    [recipientType, recipientId]
  );
  return {
    updatedCount: updated.rowCount,
    deletedCount: deleted.rowCount,
  };
};

const deleteNotification = async (id, recipientType, recipientId) => {
  const result = await db.query(
    "DELETE FROM notifications WHERE id = $1 AND recipient_type = $2 AND recipient_id = $3",
    [id, recipientType, recipientId]
  );
  return result.rowCount > 0;
};

const createNotification = async (data, client = null) => {
  const runner = client || db;
  const result = await runner.query(
    `INSERT INTO notifications (
      recipient_id, recipient_type, title, message, type, read, created_at, updated_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *`,
    [
      data.recipientId,
      data.recipientType,
      data.title,
      data.message,
      data.type || "info",
      Boolean(data.read),
      data.createdAt || new Date(),
      data.updatedAt || null,
      toJson(data.extra || {}, {}),
    ]
  );
  // Keep only the newest 30 notifications per recipient.
  await runner.query(
    `DELETE FROM notifications
     WHERE id IN (
       SELECT id FROM notifications
       WHERE recipient_id = $1 AND recipient_type = $2
       ORDER BY created_at DESC NULLS LAST
       OFFSET 30
     )`,
    [data.recipientId, data.recipientType]
  );
  // Push via SSE if user is connected
  try {
    const sseManager = require("../helpers/sse.manager");
    if (sseManager.isUserConnected(data.recipientId)) {
      sseManager.sendToUser(data.recipientId, "notification", {
        id: result.rows[0].id,
        title: data.title,
        message: data.message,
        type: data.type || "info",
        createdAt: result.rows[0].created_at,
      });
    }
  } catch {
    // SSE push is best-effort
  }

  return result.rows[0];
};

const createMany = async (items, client = null) => {
  if (!items.length) return [];
  const created = [];
  for (const item of items) {
    // eslint-disable-next-line no-await-in-loop
    const row = await createNotification(item, client);
    created.push(row);
  }
  return created;
};

const mapNotificationRow = (row) => ({
  id: row.id,
  _id: row.id,
  title: row.title,
  message: row.message,
  type: row.type,
  read: row.read,
  createdAt: row.created_at,
  extra: parseJson(row.extra, {}),
});

module.exports = {
  listByRecipient,
  countUnread,
  markRead,
  markAllRead,
  deleteNotification,
  createNotification,
  createMany,
  mapNotificationRow,
};
