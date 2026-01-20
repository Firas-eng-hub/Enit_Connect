const db = require("../db");
const { randomUUID } = require("crypto");
const { parseJson } = require("../utils/validation");

const toJson = (value, fallback) =>
  JSON.stringify(value !== undefined ? value : fallback);

const createOffer = async (data) => {
  const result = await db.query(
    `INSERT INTO offers (
      title, type, start_date, end_date, content, company_id,
      created_at, docs, candidacies_raw, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      data.title,
      data.type,
      data.start,
      data.end || null,
      data.content || null,
      data.companyId,
      data.createdAt || new Date(),
      toJson(data.docs || [], []),
      toJson([], []),
      toJson({}, {}),
    ]
  );
  return result.rows[0];
};

const listOffers = async () => {
  const result = await db.query("SELECT * FROM offers ORDER BY created_at DESC NULLS LAST");
  return result.rows;
};

const listOffersByCompany = async (companyId) => {
  const result = await db.query(
    "SELECT * FROM offers WHERE company_id = $1 ORDER BY created_at DESC NULLS LAST",
    [companyId]
  );
  return result.rows;
};

const searchByKey = async (column, key) => {
  const result = await db.query(
    `SELECT * FROM offers WHERE ${column} ILIKE $1 ORDER BY created_at DESC NULLS LAST`,
    [`${key}%`]
  );
  return result.rows;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM offers WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const updateOffer = async (id, data) => {
  const result = await db.query(
    `UPDATE offers
     SET title = $1,
         type = $2,
         start_date = $3,
         end_date = $4,
         content = $5,
         docs = $6
     WHERE id = $7
     RETURNING *`,
    [
      data.title,
      data.type,
      data.start,
      data.end || null,
      data.content || null,
      toJson(data.docs || [], []),
      id,
    ]
  );
  return result.rows[0] || null;
};

const deleteOffer = async (id) => {
  const result = await db.query("DELETE FROM offers WHERE id = $1", [id]);
  return result.rowCount > 0;
};

const listCandidacies = async (offerId) => {
  const result = await db.query(
    "SELECT * FROM offer_candidacies WHERE offer_id = $1 ORDER BY created_at DESC NULLS LAST, source_index ASC",
    [offerId]
  );
  return result.rows;
};

const listCandidaciesByOfferIds = async (offerIds) => {
  if (!offerIds.length) return [];
  const result = await db.query(
    "SELECT * FROM offer_candidacies WHERE offer_id = ANY($1::uuid[]) ORDER BY created_at DESC NULLS LAST, source_index ASC",
    [offerIds]
  );
  return result.rows;
};

const createCandidacy = async (data) => {
  const sourceKey = data.sourceKey || randomUUID();
  const result = await db.query(
    `INSERT INTO offer_candidacies (
      id, offer_id, source_key, source_index, student_id, body, status, created_at, documents, extra
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *`,
    [
      data.id || randomUUID(),
      data.offerId,
      sourceKey,
      data.sourceIndex || 0,
      data.studentId,
      data.body || null,
      data.status || "pending",
      data.createdAt || new Date(),
      toJson(data.documents || [], []),
      toJson(data.extra || {}, {}),
    ]
  );
  return result.rows[0];
};

const updateCandidacyStatus = async (id, status) => {
  const result = await db.query(
    "UPDATE offer_candidacies SET status = $1 WHERE id = $2 RETURNING *",
    [status, id]
  );
  return result.rows[0] || null;
};

const mapCandidacyRow = (row) => {
  const extra = parseJson(row.extra, {});
  return {
    _id: row.id,
    studentId: row.student_id,
    body: row.body,
    documents: parseJson(row.documents, []),
    status: row.status,
    createdAt: row.created_at,
    studentSnapshot: extra.studentSnapshot,
  };
};

const mapOfferRow = (row, candidacies = []) => ({
  _id: row.id,
  id: row.id,
  title: row.title,
  type: row.type,
  start: row.start_date,
  end: row.end_date,
  docs: parseJson(row.docs, []),
  content: row.content,
  companyid: row.company_id,
  companyId: row.company_id,
  createdat: row.created_at,
  createdAt: row.created_at,
  candidacies,
});

module.exports = {
  createOffer,
  listOffers,
  listOffersByCompany,
  searchByKey,
  findById,
  updateOffer,
  deleteOffer,
  listCandidacies,
  listCandidaciesByOfferIds,
  createCandidacy,
  updateCandidacyStatus,
  mapCandidacyRow,
  mapOfferRow,
};
