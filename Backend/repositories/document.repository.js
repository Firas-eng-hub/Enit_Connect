const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createDocument = async (data) => {
  const result = await db.query(
    `INSERT INTO documents (
      creator_id, creator_name, creator_type, date, title, description, category, tags, type, access_level, link,
      thumbnail_url, emplacement, extension, mime_type, size, size_bytes, version, pinned, last_opened_at,
      scan_status, scan_checked_at, scan_error, quarantined, created_at, updated_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
    RETURNING *`,
    [
      data.creatorId || null,
      data.creatorName,
      data.creatorType || null,
      data.date || null,
      data.title,
      data.description || null,
      data.category || null,
      data.tags || [],
      data.type,
      data.accessLevel || "private",
      data.link || null,
      data.thumbnailUrl || null,
      data.emplacement || "root",
      data.extension || null,
      data.mimeType || null,
      data.size || null,
      data.sizeBytes || null,
      data.version ?? 1,
      data.pinned ?? false,
      data.lastOpenedAt || null,
      data.scanStatus || "clean",
      data.scanCheckedAt || null,
      data.scanError || null,
      data.quarantined ?? false,
      data.createdAt || new Date(),
      data.updatedAt || null,
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const listDocuments = async ({
  creatorId,
  creatorType,
  emplacement,
  category,
  query,
  type,
  fromDate,
  toDate,
  minSize,
  maxSize,
  tags,
  page,
  pageSize,
}) => {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (creatorId) {
    conditions.push(`creator_id = $${idx}`);
    params.push(creatorId);
    idx += 1;
  }

  if (creatorType) {
    conditions.push(`creator_type = $${idx}`);
    params.push(creatorType);
    idx += 1;
  }

  if (emplacement) {
    conditions.push(`emplacement = $${idx}`);
    params.push(emplacement);
    idx += 1;
  }

  if (category) {
    conditions.push(`category = $${idx}`);
    params.push(category);
    idx += 1;
  }

  if (type) {
    conditions.push(`type = $${idx}`);
    params.push(type);
    idx += 1;
  }

  if (query) {
    conditions.push(
      `(title ILIKE $${idx} OR description ILIKE $${idx} OR array_to_string(tags, ' ') ILIKE $${idx})`
    );
    params.push(`%${query}%`);
    idx += 1;
  }

  if (fromDate) {
    conditions.push(`created_at >= $${idx}`);
    params.push(fromDate);
    idx += 1;
  }

  if (toDate) {
    conditions.push(`created_at <= $${idx}`);
    params.push(toDate);
    idx += 1;
  }

  if (minSize !== null && minSize !== undefined) {
    conditions.push(`size_bytes >= $${idx}`);
    params.push(minSize);
    idx += 1;
  }

  if (maxSize !== null && maxSize !== undefined) {
    conditions.push(`size_bytes <= $${idx}`);
    params.push(maxSize);
    idx += 1;
  }

  if (tags && tags.length) {
    conditions.push(`tags && $${idx}::text[]`);
    params.push(tags);
    idx += 1;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = pageSize ? Number(pageSize) : null;
  const offset = page && limit ? (Number(page) - 1) * limit : null;
  const paginationClause = limit ? `LIMIT $${idx} OFFSET $${idx + 1}` : "";
  const listParams = [...params];
  if (limit) {
    listParams.push(limit, offset || 0);
  }

  const result = await db.query(
    `SELECT * FROM documents ${whereClause} ORDER BY created_at DESC NULLS LAST ${paginationClause}`,
    listParams
  );
  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM documents ${whereClause}`,
    params
  );
  return { rows: result.rows, total: countResult.rows[0]?.total ?? 0 };
};

// List documents created by admins (including legacy rows with NULL creator_type).
const listAdminDocuments = async ({
  emplacement,
  category,
  query,
  type,
  tags,
  fromDate,
  toDate,
  sort,
  order,
  page,
  pageSize,
}) => {
  const conditions = ["(creator_type = $1 OR creator_type IS NULL)"];
  const params = ["admin"];
  let idx = 2;

  if (emplacement) {
    conditions.push(`emplacement = $${idx}`);
    params.push(emplacement);
    idx += 1;
  }

  if (category) {
    conditions.push(`category = $${idx}`);
    params.push(category);
    idx += 1;
  }

  if (type) {
    conditions.push(`type = $${idx}`);
    params.push(type);
    idx += 1;
  }

  if (query) {
    conditions.push(
      `(title ILIKE $${idx} OR description ILIKE $${idx} OR array_to_string(tags, ' ') ILIKE $${idx})`
    );
    params.push(`%${query}%`);
    idx += 1;
  }

  if (fromDate) {
    conditions.push(`created_at >= $${idx}`);
    params.push(fromDate);
    idx += 1;
  }

  if (toDate) {
    conditions.push(`created_at <= $${idx}`);
    params.push(toDate);
    idx += 1;
  }

  if (tags && tags.length) {
    conditions.push(`tags && $${idx}::text[]`);
    params.push(tags);
    idx += 1;
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const sortMap = {
    createdAt: "created_at",
    updatedAt: "updated_at",
    title: "title",
  };
  const sortKey = sortMap[sort] || "created_at";
  const sortDir = String(order || "desc").toLowerCase() === "asc" ? "ASC" : "DESC";
  const orderClause = `ORDER BY ${sortKey} ${sortDir} NULLS LAST`;

  const limit = pageSize ? Number(pageSize) : null;
  const offset = page && limit ? (Number(page) - 1) * limit : null;
  const paginationClause = limit ? `LIMIT $${idx} OFFSET $${idx + 1}` : "";
  const listParams = [...params];
  if (limit) {
    listParams.push(limit, offset || 0);
  }

  const result = await db.query(
    `SELECT * FROM documents ${whereClause} ${orderClause} ${paginationClause}`,
    listParams
  );
  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM documents ${whereClause}`,
    params
  );
  return { rows: result.rows, total: countResult.rows[0]?.total ?? 0 };
};

const listByEmplacement = async (emplacement) => {
  const result = await db.query(
    "SELECT * FROM documents WHERE emplacement = $1 ORDER BY created_at DESC NULLS LAST",
    [emplacement]
  );
  return result.rows;
};

const searchByTitle = async (title) => {
  const result = await db.query(
    "SELECT * FROM documents WHERE title ILIKE $1 ORDER BY created_at DESC NULLS LAST",
    [`${title}%`]
  );
  return result.rows;
};

const deleteByTitleAndEmplacement = async (title, emplacement) => {
  const result = await db.query(
    "DELETE FROM documents WHERE title = $1 AND emplacement = $2",
    [title, emplacement]
  );
  return result.rowCount > 0;
};

const deleteById = async (id) => {
  const result = await db.query("DELETE FROM documents WHERE id = $1", [id]);
  return result.rowCount > 0;
};

const listByIds = async (ids) => {
  if (!ids.length) return [];
  const result = await db.query("SELECT * FROM documents WHERE id = ANY($1::uuid[])", [ids]);
  return result.rows;
};

const updateDocumentMeta = async (id, data) => {
  const expectedUpdatedAt =
    data.expectedUpdatedAt === undefined ? undefined : data.expectedUpdatedAt;
  const params = [
    data.title || null,
    data.description || null,
    data.category || null,
    Array.isArray(data.tags) ? data.tags : null,
    data.emplacement || null,
    data.accessLevel || null,
    typeof data.pinned === "boolean" ? data.pinned : null,
    id,
  ];

  let whereClause = "WHERE id = $8";
  if (expectedUpdatedAt !== undefined) {
    params.push(expectedUpdatedAt);
    whereClause = `WHERE id = $8 AND (
      (updated_at IS NULL AND $9::timestamptz IS NULL)
      OR (updated_at IS NOT NULL AND $9::timestamptz IS NOT NULL AND date_trunc('milliseconds', updated_at) = date_trunc('milliseconds', $9::timestamptz))
    )`;
  }

  const result = await db.query(
    `UPDATE documents
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         category = COALESCE($3, category),
         tags = COALESCE($4, tags),
         emplacement = COALESCE($5, emplacement),
         access_level = COALESCE($6, access_level),
         pinned = COALESCE($7, pinned),
         updated_at = now()
     ${whereClause}
     RETURNING *`,
    params
  );
  return result.rows[0] || null;
};

const updatePinned = async (id, pinned) => {
  const result = await db.query(
    `UPDATE documents
     SET pinned = $1, updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [pinned, id]
  );
  return result.rows[0] || null;
};

const markOpened = async (id) => {
  const result = await db.query(
    `UPDATE documents
     SET last_opened_at = now()
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
};

const updateDocumentFile = async (id, data) => {
  const result = await db.query(
    `UPDATE documents
     SET link = COALESCE($1, link),
         extension = COALESCE($2, extension),
         mime_type = COALESCE($3, mime_type),
         size = COALESCE($4, size),
         size_bytes = COALESCE($5, size_bytes),
         version = COALESCE($6, version),
         thumbnail_url = COALESCE($7, thumbnail_url),
         scan_status = COALESCE($8, scan_status),
         scan_checked_at = COALESCE($9, scan_checked_at),
         scan_error = COALESCE($10, scan_error),
         quarantined = COALESCE($11, quarantined),
         updated_at = now()
     WHERE id = $12
     RETURNING *`,
    [
      data.link || null,
      data.extension || null,
      data.mimeType || null,
      data.size || null,
      data.sizeBytes || null,
      data.version || null,
      data.thumbnailUrl || null,
      data.scanStatus || null,
      data.scanCheckedAt || null,
      data.scanError || null,
      typeof data.quarantined === "boolean" ? data.quarantined : null,
      id,
    ]
  );
  return result.rows[0] || null;
};

const updateScanStatus = async (id, data) => {
  const result = await db.query(
    `UPDATE documents
     SET scan_status = COALESCE($1, scan_status),
         scan_checked_at = COALESCE($2, scan_checked_at),
         scan_error = COALESCE($3, scan_error),
         quarantined = COALESCE($4, quarantined),
         updated_at = now()
     WHERE id = $5
     RETURNING *`,
    [
      data.scanStatus || null,
      data.scanCheckedAt || null,
      data.scanError || null,
      typeof data.quarantined === "boolean" ? data.quarantined : null,
      id,
    ]
  );
  return result.rows[0] || null;
};

const mapDocumentRow = (row) => ({
  idcreator: row.creator_id,
  creatorId: row.creator_id,
  namecreator: row.creator_name,
  creatorName: row.creator_name,
  creatorType: row.creator_type,
  date: row.date,
  title: row.title,
  name: row.title,
  description: row.description,
  category: row.category,
  tags: row.tags || [],
  extension: row.extension,
  mimeType: row.mime_type,
  type: row.type,
  accessLevel: row.access_level,
  link: row.link,
  thumbnailUrl: row.thumbnail_url,
  path: row.link,
  emplacement: row.emplacement,
  id: row.id,
  _id: row.id,
  size: row.size,
  sizeBytes: row.size_bytes,
  version: row.version,
  pinned: row.pinned,
  lastOpenedAt: row.last_opened_at,
  scanStatus: row.scan_status,
  scanCheckedAt: row.scan_checked_at,
  scanError: row.scan_error,
  quarantined: row.quarantined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  extra: parseJson(row.extra, {}),
});

const getFolderFullPath = (folderRow) => {
  const parent = folderRow?.emplacement || "root";
  const title = folderRow?.title || "";
  if (!title) return "";
  return parent === "root" ? title : `${parent}/${title}`;
};

// Folders are stored as documents with type='folder' and `emplacement` as the parent path.
const createFolderDocument = async ({ creatorId, creatorName, creatorType, title, parentPath }) => {
  return createDocument({
    creatorId,
    creatorName,
    creatorType,
    date: new Date(),
    title,
    description: null,
    category: null,
    tags: [],
    type: "folder",
    accessLevel: "private",
    link: null,
    thumbnailUrl: null,
    emplacement: parentPath || "root",
    extension: null,
    mimeType: null,
    size: null,
    sizeBytes: null,
    createdAt: new Date(),
  });
};

const renameFolderDocument = async ({ id, title, expectedUpdatedAt }) => {
  // Rename the folder document itself, then migrate descendants' emplacement prefix if needed.
  await db.query("BEGIN");
  try {
    const result = await db.query("SELECT * FROM documents WHERE id = $1 FOR UPDATE", [id]);
    const folder = result.rows[0];
    if (!folder || folder.type !== "folder") {
      await db.query("ROLLBACK");
      return null;
    }

    const oldPath = getFolderFullPath(folder);
    const updated = await updateDocumentMeta(id, { title, expectedUpdatedAt });
    if (!updated) {
      // Conflict or not found.
      await db.query("ROLLBACK");
      return null;
    }

    const newPath = getFolderFullPath({ ...folder, title });
    if (oldPath && newPath && oldPath !== newPath) {
      await db.query(
        `UPDATE documents
         SET emplacement = CASE
           WHEN emplacement = $1 THEN $2
           ELSE $2 || substring(emplacement from char_length($1) + 1)
         END,
         updated_at = now()
         WHERE emplacement = $1 OR emplacement LIKE $1 || '/%'`,
        [oldPath, newPath]
      );
    }

    await db.query("COMMIT");
    return updated;
  } catch (err) {
    await db.query("ROLLBACK");
    throw err;
  }
};

const deleteFolderIfEmpty = async (id) => {
  const result = await db.query("SELECT * FROM documents WHERE id = $1", [id]);
  const folder = result.rows[0];
  if (!folder || folder.type !== "folder") {
    return { deleted: false, reason: "not_found" };
  }

  const folderPath = getFolderFullPath(folder);
  const children = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM documents
     WHERE emplacement = $1 OR emplacement LIKE $1 || '/%'`,
    [folderPath]
  );
  const total = children.rows[0]?.total ?? 0;
  if (total > 0) {
    return { deleted: false, reason: "not_empty" };
  }

  const ok = await deleteById(id);
  return { deleted: ok, reason: ok ? null : "not_found" };
};

const bulkMoveDocuments = async ({ ids, targetPath }) => {
  const safeTarget = targetPath || "root";
  if (!ids.length) return { moved: 0 };

  const result = await db.query(
    `UPDATE documents
     SET emplacement = $1, updated_at = now()
     WHERE id = ANY($2::uuid[])
     RETURNING id`,
    [safeTarget, ids]
  );
  return { moved: result.rowCount || 0 };
};

// Convenience wrapper for updating admin document audience (stored in `access_level`).
const updateDocumentAudience = async ({ id, accessLevel, expectedUpdatedAt }) => {
  return updateDocumentMeta(id, { accessLevel, expectedUpdatedAt });
};

module.exports = {
  createDocument,
  listDocuments,
  listAdminDocuments,
  listByEmplacement,
  searchByTitle,
  deleteByTitleAndEmplacement,
  deleteById,
  listByIds,
  updateDocumentMeta,
  updateDocumentFile,
  updateScanStatus,
  updatePinned,
  markOpened,
  mapDocumentRow,
  createFolderDocument,
  renameFolderDocument,
  deleteFolderIfEmpty,
  bulkMoveDocuments,
  updateDocumentAudience,
};
