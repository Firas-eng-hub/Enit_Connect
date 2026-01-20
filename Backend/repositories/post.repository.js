const db = require("../db");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createPost = async (data) => {
  const result = await db.query(
    `INSERT INTO posts (
      topic, title, description, body, date, user_name, created_at, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      data.topic,
      data.title,
      data.description,
      data.body,
      data.date || null,
      data.userName,
      data.createdAt || new Date(),
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const listAll = async () => {
  const result = await db.query("SELECT * FROM posts ORDER BY created_at DESC NULLS LAST");
  return result.rows;
};

const mapPostRow = (row) => ({
  _id: row.id,
  id: row.id,
  topic: row.topic,
  title: row.title,
  description: row.description,
  body: row.body,
  date: row.date,
  userName: row.user_name,
  createdAt: row.created_at,
  extra: parseJson(row.extra, {}),
});

module.exports = {
  createPost,
  listAll,
  mapPostRow,
};
