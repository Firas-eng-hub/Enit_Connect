const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createNews = async (data) => {
  const result = await db.query(
    `INSERT INTO news (
      date, title, content, picture, docs, status, audience, category, tags, created_at, updated_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    RETURNING *`,
    [
      data.date || new Date(),
      data.title,
      data.content,
      data.picture || null,
      toJson(data.docs || [], []),
      data.status || "published",
      data.audience || [],
      data.category || null,
      data.tags || [],
      data.createdAt || new Date(),
      data.updatedAt || null,
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const updateNews = async (id, data) => {
  const result = await db.query(
    `UPDATE news
     SET date = $1,
         title = $2,
         content = $3,
         picture = $4,
         docs = $5,
         status = $6,
         audience = $7,
         category = $8,
         tags = $9,
         updated_at = now()
     WHERE id = $10
     RETURNING *`,
    [
      data.date || new Date(),
      data.title,
      data.content,
      data.picture || null,
      toJson(data.docs || [], []),
      data.status || "published",
      data.audience || [],
      data.category || null,
      data.tags || [],
      id,
    ]
  );
  return result.rows[0] || null;
};

const listAll = async () => {
  const result = await db.query("SELECT * FROM news ORDER BY date DESC NULLS LAST");
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM news WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const deleteNews = async (id) => {
  const result = await db.query("DELETE FROM news WHERE id = $1", [id]);
  return result.rowCount > 0;
};

const mapNewsRow = (row) => ({
  _id: row.id,
  id: row.id,
  date: row.date,
  title: row.title,
  content: row.content,
  picture: row.picture,
  docs: parseJson(row.docs, []),
  status: row.status,
  audience: row.audience || [],
  category: row.category,
  tags: row.tags || [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  extra: parseJson(row.extra, {}),
});

module.exports = {
  createNews,
  updateNews,
  listAll,
  findById,
  deleteNews,
  mapNewsRow,
};
