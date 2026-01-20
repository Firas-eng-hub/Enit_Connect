const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createDocument = async (data) => {
  const result = await db.query(
    `INSERT INTO documents (
      creator_id, creator_name, date, title, type, link,
      emplacement, extension, size, created_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      data.creatorId || null,
      data.creatorName,
      data.date || null,
      data.title,
      data.type,
      data.link || null,
      data.emplacement,
      data.extension || null,
      data.size || null,
      data.createdAt || new Date(),
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
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

const mapDocumentRow = (row) => ({
  idcreator: row.creator_id,
  namecreator: row.creator_name,
  date: row.date,
  title: row.title,
  extension: row.extension,
  type: row.type,
  link: row.link,
  emplacement: row.emplacement,
  id: row.id,
  size: row.size,
  extra: parseJson(row.extra, {}),
});

module.exports = {
  createDocument,
  listByEmplacement,
  searchByTitle,
  deleteByTitleAndEmplacement,
  mapDocumentRow,
};
