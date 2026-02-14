const db = require("../db");
const path = require("path");
const { parseJson } = require("../utils/validation");

const listAll = async () => {
  const result = await db.query(
    "SELECT * FROM partners ORDER BY created_at DESC, name ASC"
  );
  return result.rows;
};

const createPartner = async ({ name, logoUrl }) => {
  const result = await db.query(
    `INSERT INTO partners (name, logo_url, created_at, updated_at, extra)
     VALUES ($1, $2, now(), null, $3)
     RETURNING *`,
    [name, logoUrl, JSON.stringify({})]
  );
  return result.rows[0];
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM partners WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const deletePartner = async (id) => {
  const result = await db.query(
    "DELETE FROM partners WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
};

const extractLocalUploadFilename = (logoUrl) => {
  const raw = String(logoUrl || "").trim();
  if (!raw) return null;

  let pathname = raw;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const parsed = new URL(raw);
      if (!isLocalhostUrl(parsed)) {
        return null;
      }
      pathname = parsed.pathname;
    } catch (err) {
      return null;
    }
  } else {
    pathname = raw.split("?")[0].split("#")[0];
  }

  if (!pathname.startsWith("/uploads/") && !pathname.startsWith("uploads/")) {
    return null;
  }

  return path.basename(pathname);
};

const countByLocalUploadFilename = async (filename) => {
  if (!filename) return 0;

  const result = await db.query(
    `SELECT logo_url
     FROM partners
     WHERE logo_url IS NOT NULL`
  );

  return result.rows.reduce((count, row) => {
    return count + (extractLocalUploadFilename(row.logo_url) === filename ? 1 : 0);
  }, 0);
};

const isLocalhostUrl = (url) => {
  const host = String(url.hostname || "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
};

const mapPartnerRow = (row) => {
  let logoUrl = row.logo_url;
  const isAbsoluteHttpUrl =
    typeof logoUrl === "string" &&
    (logoUrl.startsWith("http://") || logoUrl.startsWith("https://"));

  if (isAbsoluteHttpUrl) {
    try {
      const parsed = new URL(logoUrl);
      // Normalize to relative path only for local development hosts.
      if (parsed.pathname.startsWith("/uploads/") && isLocalhostUrl(parsed)) {
        logoUrl = parsed.pathname;
      }
    } catch (err) {
      // Keep original if URL parsing fails.
    }
  }

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    logoUrl,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    extra: parseJson(row.extra, {}),
  };
};

module.exports = {
  listAll,
  createPartner,
  findById,
  deletePartner,
  extractLocalUploadFilename,
  countByLocalUploadFilename,
  mapPartnerRow,
};
