const db = require("../db");
const { parseJson } = require("../utils/validation");

const VALID_FOLDERS = new Set(["inbox", "sent", "drafts"]);

const normalizeFolder = (value) => {
  const folder = String(value || "").trim().toLowerCase();
  return VALID_FOLDERS.has(folder) ? folder : "inbox";
};

const mapRecipientRow = (row) => ({
  id: row.recipient_id,
  type: row.recipient_type,
  name: row.recipient_name || row.recipient_email || "Unknown recipient",
  email: row.recipient_email || null,
});

const mapMailboxRow = (row, recipients = []) => ({
  _id: row.item_id || row.id,
  id: row.item_id || row.id,
  itemId: row.item_id || row.id,
  messageId: row.message_id,
  folder: row.folder,
  read: Boolean(row.read),
  starred: Boolean(row.starred),
  locked: Boolean(row.locked),
  deletedAt: row.deleted_at || null,
  subject: row.subject,
  body: row.body,
  preview: String(row.body || "").slice(0, 180),
  sentAt: row.sent_at,
  sender: {
    id: row.sender_id,
    type: row.sender_type,
    name: row.sender_name || row.sender_email || "Unknown sender",
    email: row.sender_email || null,
  },
  recipients,
  extra: parseJson(row.message_extra, {}),
});

const listRecipientsByMessageIds = async (messageIds) => {
  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return new Map();
  }

  const result = await db.query(
    `SELECT
      mr.message_id,
      mr.recipient_id,
      mr.recipient_type,
      CASE
        WHEN mr.recipient_type = 'student' THEN NULLIF(CONCAT_WS(' ', s.firstname, s.lastname), '')
        WHEN mr.recipient_type = 'company' THEN c.name
        WHEN mr.recipient_type = 'admin' THEN COALESCE(a.extra->>'name', split_part(a.email, '@', 1), 'Administrator')
        ELSE NULL
      END AS recipient_name,
      CASE
        WHEN mr.recipient_type = 'student' THEN s.email
        WHEN mr.recipient_type = 'company' THEN c.email
        WHEN mr.recipient_type = 'admin' THEN a.email
        ELSE NULL
      END AS recipient_email
    FROM mail_recipients mr
    LEFT JOIN students s ON mr.recipient_type = 'student' AND s.id = mr.recipient_id
    LEFT JOIN companies c ON mr.recipient_type = 'company' AND c.id = mr.recipient_id
    LEFT JOIN admins a ON mr.recipient_type = 'admin' AND a.id = mr.recipient_id
    WHERE mr.message_id = ANY($1::uuid[])
    ORDER BY mr.message_id ASC`,
    [messageIds]
  );

  const grouped = new Map();
  result.rows.forEach((row) => {
    if (!grouped.has(row.message_id)) {
      grouped.set(row.message_id, []);
    }
    grouped.get(row.message_id).push(mapRecipientRow(row));
  });

  return grouped;
};

const mailboxSelect = `
  SELECT
    mi.id AS item_id,
    mi.message_id,
    mi.folder,
    mi.read,
    mi.starred,
    mi.locked,
    mi.deleted_at,
    mm.subject,
    mm.body,
    mm.sent_at,
    mm.sender_id,
    mm.sender_type,
    mm.extra AS message_extra,
    CASE
      WHEN mm.sender_type = 'student' THEN NULLIF(CONCAT_WS(' ', s_sender.firstname, s_sender.lastname), '')
      WHEN mm.sender_type = 'company' THEN c_sender.name
      WHEN mm.sender_type = 'admin' THEN COALESCE(a_sender.extra->>'name', split_part(a_sender.email, '@', 1), 'Administrator')
      WHEN mm.sender_type = 'system' THEN 'ENIT Connect'
      ELSE NULL
    END AS sender_name,
    CASE
      WHEN mm.sender_type = 'student' THEN s_sender.email
      WHEN mm.sender_type = 'company' THEN c_sender.email
      WHEN mm.sender_type = 'admin' THEN a_sender.email
      ELSE NULL
    END AS sender_email
  FROM mailbox_items mi
  JOIN mail_messages mm ON mm.id = mi.message_id
  LEFT JOIN students s_sender ON mm.sender_type = 'student' AND s_sender.id = mm.sender_id
  LEFT JOIN companies c_sender ON mm.sender_type = 'company' AND c_sender.id = mm.sender_id
  LEFT JOIN admins a_sender ON mm.sender_type = 'admin' AND a_sender.id = mm.sender_id
`;

const listMailboxItems = async ({
  ownerId,
  ownerType,
  folder,
  search = "",
  limit = 50,
  offset = 0,
}) => {
  const normalizedFolder = normalizeFolder(folder);
  const normalizedSearch = String(search || "").trim();
  const pattern = `%${normalizedSearch}%`;

  const [countResult, rowsResult] = await Promise.all([
    db.query(
      `SELECT COUNT(*)::int AS total
       FROM mailbox_items mi
       JOIN mail_messages mm ON mm.id = mi.message_id
       WHERE mi.owner_id = $1
         AND mi.owner_type = $2
         AND mi.folder = $3
         AND ($4::text = '' OR mm.subject ILIKE $5 OR mm.body ILIKE $5)`,
      [ownerId, ownerType, normalizedFolder, normalizedSearch, pattern]
    ),
    db.query(
      `${mailboxSelect}
       WHERE mi.owner_id = $1
         AND mi.owner_type = $2
         AND mi.folder = $3
         AND ($4::text = '' OR mm.subject ILIKE $5 OR mm.body ILIKE $5)
       ORDER BY mm.sent_at DESC NULLS LAST, mi.id DESC
       LIMIT $6
       OFFSET $7`,
      [ownerId, ownerType, normalizedFolder, normalizedSearch, pattern, limit, offset]
    ),
  ]);

  const rows = rowsResult.rows;
  const recipientsByMessageId = await listRecipientsByMessageIds(
    rows.map((row) => row.message_id)
  );

  const items = rows.map((row) =>
    mapMailboxRow(row, recipientsByMessageId.get(row.message_id) || [])
  );

  return {
    items,
    total: Number(countResult.rows[0]?.total || 0),
  };
};

const getMailboxItemById = async ({ itemId, ownerId = null, ownerType = null }) => {
  const params = [itemId];
  let ownerWhere = "";

  if (ownerId && ownerType) {
    params.push(ownerId, ownerType);
    ownerWhere = ` AND mi.owner_id = $2 AND mi.owner_type = $3`;
  }

  const result = await db.query(
    `${mailboxSelect}
     WHERE mi.id = $1
     ${ownerWhere}
     LIMIT 1`,
    params
  );

  const row = result.rows[0];
  if (!row) return null;

  const recipientsByMessageId = await listRecipientsByMessageIds([row.message_id]);
  return mapMailboxRow(row, recipientsByMessageId.get(row.message_id) || []);
};

const createMessageWithDelivery = async ({
  senderId,
  senderType,
  subject,
  body,
  recipients,
  messageExtra = {},
}) => {
  return db.withTransaction(async (client) => {
    const messageResult = await client.query(
      `INSERT INTO mail_messages (subject, body, sender_id, sender_type, sent_at, extra)
       VALUES ($1, $2, $3, $4, now(), $5)
       RETURNING *`,
      [subject, body, senderId, senderType, JSON.stringify(messageExtra || {})]
    );
    const message = messageResult.rows[0];

    for (const recipient of recipients) {
      await client.query(
        `INSERT INTO mail_recipients (message_id, recipient_id, recipient_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, recipient_id, recipient_type) DO NOTHING`,
        [message.id, recipient.id, recipient.type]
      );
    }

    await client.query(
      `INSERT INTO mailbox_items (message_id, owner_id, owner_type, folder, read, starred, locked, created_at, updated_at)
       VALUES ($1, $2, $3, 'sent', true, false, false, now(), now())`,
      [message.id, senderId, senderType]
    );

    for (const recipient of recipients) {
      await client.query(
        `INSERT INTO mailbox_items (message_id, owner_id, owner_type, folder, read, starred, locked, created_at, updated_at)
         VALUES ($1, $2, $3, 'inbox', false, false, false, now(), now())`,
        [message.id, recipient.id, recipient.type]
      );
    }

    return message;
  });
};

const saveDraft = async ({
  ownerId,
  ownerType,
  subject,
  body,
  recipients = [],
  messageExtra = {},
}) => {
  const message = await db.withTransaction(async (client) => {
    const draftExtra = {
      ...messageExtra,
      draft: true,
    };

    const messageResult = await client.query(
      `INSERT INTO mail_messages (subject, body, sender_id, sender_type, sent_at, extra)
       VALUES ($1, $2, $3, $4, now(), $5)
       RETURNING *`,
      [subject, body, ownerId, ownerType, JSON.stringify(draftExtra)]
    );
    const row = messageResult.rows[0];

    for (const recipient of recipients) {
      await client.query(
        `INSERT INTO mail_recipients (message_id, recipient_id, recipient_type)
         VALUES ($1, $2, $3)
         ON CONFLICT (message_id, recipient_id, recipient_type) DO NOTHING`,
        [row.id, recipient.id, recipient.type]
      );
    }

    await client.query(
      `INSERT INTO mailbox_items (message_id, owner_id, owner_type, folder, read, starred, locked, created_at, updated_at)
       VALUES ($1, $2, $3, 'drafts', true, false, false, now(), now())`,
      [row.id, ownerId, ownerType]
    );

    return row;
  });

  const draftItem = await db.query(
    `SELECT id
     FROM mailbox_items
     WHERE message_id = $1
       AND owner_id = $2
       AND owner_type = $3
       AND folder = 'drafts'
     LIMIT 1`,
    [message.id, ownerId, ownerType]
  );

  return getMailboxItemById({
    itemId: draftItem.rows[0].id,
    ownerId,
    ownerType,
  });
};

const updateMailboxItem = async ({
  itemId,
  ownerId,
  ownerType,
  read,
  starred,
  folder,
}) => {
  const updates = [];
  const values = [];
  let index = 1;

  if (typeof read === "boolean") {
    updates.push(`read = $${index}`);
    values.push(read);
    index += 1;
  }
  if (typeof starred === "boolean") {
    updates.push(`starred = $${index}`);
    values.push(starred);
    index += 1;
  }
  if (typeof folder === "string" && VALID_FOLDERS.has(folder)) {
    updates.push(`folder = $${index}`);
    values.push(folder);
    index += 1;
    updates.push(`deleted_at = NULL`);
  }

  if (updates.length === 0) {
    return getMailboxItemById({ itemId, ownerId, ownerType });
  }

  updates.push("updated_at = now()");
  values.push(itemId, ownerId, ownerType);

  const result = await db.query(
    `UPDATE mailbox_items
     SET ${updates.join(", ")}
     WHERE id = $${index}
       AND owner_id = $${index + 1}
       AND owner_type = $${index + 2}
     RETURNING id`,
    values
  );

  if (!result.rows[0]) return null;

  return getMailboxItemById({ itemId: result.rows[0].id, ownerId, ownerType });
};

const deleteMailboxItemForOwner = async ({ itemId, ownerId, ownerType }) => {
  const existingResult = await db.query(
    `SELECT id, message_id, folder
     FROM mailbox_items
     WHERE id = $1
       AND owner_id = $2
       AND owner_type = $3
     LIMIT 1`,
    [itemId, ownerId, ownerType]
  );
  const existing = existingResult.rows[0];
  if (!existing) return { status: "not_found" };

  await db.query(
    `DELETE FROM mailbox_items
     WHERE id = $1
       AND owner_id = $2
       AND owner_type = $3`,
    [itemId, ownerId, ownerType]
  );

  const remainingResult = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM mailbox_items
     WHERE message_id = $1`,
    [existing.message_id]
  );
  if (Number(remainingResult.rows[0]?.count || 0) === 0) {
    await db.query("DELETE FROM mail_messages WHERE id = $1", [existing.message_id]);
  }

  return { status: "deleted", messageId: existing.message_id };
};

const normalizeRecipientTypes = (types) => {
  const allowed = new Set(["student", "company", "admin"]);
  if (!Array.isArray(types)) return [];
  return Array.from(
    new Set(
      types
        .map((type) => String(type || "").trim().toLowerCase())
        .filter((type) => allowed.has(type))
    )
  );
};

const searchRecipients = async ({ types, query = "", limit = 25, excludeId = null, excludeType = null }) => {
  const normalizedTypes = normalizeRecipientTypes(types);
  if (!normalizedTypes.length) {
    return [];
  }

  const normalizedQuery = String(query || "").trim();
  const pattern = `%${normalizedQuery}%`;

  const result = await db.query(
    `SELECT *
     FROM (
       SELECT
         s.id,
         'student'::text AS type,
         NULLIF(CONCAT_WS(' ', s.firstname, s.lastname), '') AS name,
         s.email,
         s.status
       FROM students s
       WHERE 'student' = ANY($1::text[])

       UNION ALL

       SELECT
         c.id,
         'company'::text AS type,
         c.name,
         c.email,
         c.status
       FROM companies c
       WHERE 'company' = ANY($1::text[])

       UNION ALL

       SELECT
         a.id,
         'admin'::text AS type,
         COALESCE(a.extra->>'name', split_part(a.email, '@', 1), 'Administrator') AS name,
         a.email,
         'Active'::text AS status
       FROM admins a
       WHERE 'admin' = ANY($1::text[])
     ) users
     WHERE ($2::text = '' OR users.name ILIKE $3 OR users.email ILIKE $3)
       AND (
         $4::uuid IS NULL
         OR users.id <> $4::uuid
         OR users.type <> $5::text
       )
     ORDER BY users.name ASC NULLS LAST, users.email ASC
     LIMIT $6`,
    [normalizedTypes, normalizedQuery, pattern, excludeId, excludeType || "", limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name || row.email,
    email: row.email,
    status: row.status || null,
  }));
};

const listRecipientsForTypes = async ({ types, excludeId = null, excludeType = null }) => {
  const normalizedTypes = normalizeRecipientTypes(types);
  if (!normalizedTypes.length) {
    return [];
  }

  const result = await db.query(
    `SELECT *
     FROM (
      SELECT
        s.id,
        'student'::text AS type,
        NULLIF(CONCAT_WS(' ', s.firstname, s.lastname), '') AS name,
        s.email,
        s.status,
        CASE
          WHEN jsonb_typeof(s.extra->'preferences'->'notifications'->'emailNotifications') = 'boolean'
            THEN (s.extra->'preferences'->'notifications'->>'emailNotifications')::boolean
          ELSE TRUE
        END AS email_notifications_enabled
      FROM students s
      WHERE 'student' = ANY($1::text[])

       UNION ALL

      SELECT
        c.id,
        'company'::text AS type,
        c.name,
        c.email,
        c.status,
        CASE
          WHEN jsonb_typeof(c.extra->'preferences'->'notifications'->'emailNotifications') = 'boolean'
            THEN (c.extra->'preferences'->'notifications'->>'emailNotifications')::boolean
          ELSE TRUE
        END AS email_notifications_enabled
      FROM companies c
      WHERE 'company' = ANY($1::text[])

       UNION ALL

      SELECT
        a.id,
        'admin'::text AS type,
        COALESCE(a.extra->>'name', split_part(a.email, '@', 1), 'Administrator') AS name,
        a.email,
        'Active'::text AS status,
        CASE
          WHEN jsonb_typeof(a.extra->'preferences'->'notifications'->'emailNotifications') = 'boolean'
            THEN (a.extra->'preferences'->'notifications'->>'emailNotifications')::boolean
          ELSE TRUE
        END AS email_notifications_enabled
      FROM admins a
      WHERE 'admin' = ANY($1::text[])
     ) users
     WHERE (
       $2::uuid IS NULL
       OR users.id <> $2::uuid
       OR users.type <> $3::text
     )
     ORDER BY users.name ASC NULLS LAST, users.email ASC`,
    [normalizedTypes, excludeId, excludeType || ""]
  );

  return result.rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name || row.email,
    email: row.email,
    status: row.status || null,
    emailNotificationsEnabled: row.email_notifications_enabled !== false,
  }));
};

const getUserPolicy = async ({ userId, userType }) => {
  const result = await db.query(
    `SELECT *
     FROM mail_user_policies
     WHERE user_id = $1 AND user_type = $2
     LIMIT 1`,
    [userId, userType]
  );
  return result.rows[0] || null;
};

const setUserLock = async ({ userId, userType, sendingLocked, reason = null }) => {
  const result = await db.query(
    `INSERT INTO mail_user_policies (user_id, user_type, sending_locked, lock_reason, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (user_id, user_type)
     DO UPDATE SET
       sending_locked = EXCLUDED.sending_locked,
       lock_reason = EXCLUDED.lock_reason,
       updated_at = now()
     RETURNING *`,
    [userId, userType, sendingLocked, reason]
  );
  return result.rows[0] || null;
};

const hardDeleteMessage = async (messageId) => {
  const result = await db.query(
    `DELETE FROM mail_messages
     WHERE id = $1
     RETURNING id`,
    [messageId]
  );
  return result.rows[0] || null;
};

const createAuditLog = async ({
  actorId,
  actorType,
  action,
  targetMessageId = null,
  targetUserId = null,
  metadata = {},
}) => {
  const result = await db.query(
    `INSERT INTO mail_audit_logs (
      actor_id,
      actor_type,
      action,
      target_message_id,
      target_user_id,
      metadata,
      created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, now())
    RETURNING *`,
    [actorId, actorType, action, targetMessageId, targetUserId, JSON.stringify(metadata || {})]
  );
  return result.rows[0];
};

module.exports = {
  VALID_FOLDERS,
  normalizeFolder,
  listMailboxItems,
  getMailboxItemById,
  createMessageWithDelivery,
  saveDraft,
  updateMailboxItem,
  deleteMailboxItemForOwner,
  searchRecipients,
  listRecipientsForTypes,
  getUserPolicy,
  setUserLock,
  hardDeleteMessage,
  createAuditLog,
};
