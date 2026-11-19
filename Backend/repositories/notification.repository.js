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
  // Pruning to the newest 30 per recipient is done by the
  // notifications_limit_trigger (migrations 010/017), not here.
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

const KEEP_PER_RECIPIENT = 30;

// Audience tables for broadcasts (allowlist: never interpolate user input).
const BROADCAST_SOURCES = {
  student: "students",
  company: "companies",
};

/**
 * Notify every Active user of one type in a single INSERT ... SELECT, then
 * prune each recipient to the newest 30 with one set-based DELETE. The
 * per-row limit trigger is skipped for this transaction (app.bulk_notify).
 * Cost is a few statements regardless of audience size; callers should not
 * await it on the request path.
 */
const broadcast = async ({ recipientType, title, message, type = "info", extra = {} }) => {
  const table = BROADCAST_SOURCES[recipientType];
  if (!Object.prototype.hasOwnProperty.call(BROADCAST_SOURCES, recipientType)) {
    throw new Error(`Unsupported broadcast audience: ${recipientType}`);
  }

  const inserted = await db.withTransaction(async (client) => {
    await client.query("SELECT set_config('app.bulk_notify', 'on', true)");
    const result = await client.query(
      `INSERT INTO notifications (recipient_id, recipient_type, title, message, type, read, created_at, extra)
       SELECT u.id, $1, $2, $3, $4, false, now(), $5::jsonb
       FROM ${table} u
       WHERE u.status = 'Active'`,
      [recipientType, title, message, type, toJson(extra, {})]
    );
    await client.query(
      `DELETE FROM notifications n
       USING (
         SELECT id FROM (
           SELECT id, row_number() OVER (
             PARTITION BY recipient_id ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS rn
           FROM notifications
           WHERE recipient_type = $1
         ) ranked
         WHERE ranked.rn > $2
       ) stale
       WHERE n.id = stale.id`,
      [recipientType, KEEP_PER_RECIPIENT]
    );
    return result.rowCount;
  });

  // Live update only for currently connected users of that type.
  try {
    const sseManager = require("../helpers/sse.manager");
    sseManager.broadcastToType(recipientType, "notification", {
      id: `broadcast-${Date.now()}`,
      title,
      message,
      type,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // SSE push is best-effort
  }

  return inserted;
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
  broadcast,
  mapNotificationRow,
};
