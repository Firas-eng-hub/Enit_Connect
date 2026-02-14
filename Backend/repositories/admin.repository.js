const db = require("../db");
const createAdmin = async ({ email, password }) => {
  const result = await db.query(
    `INSERT INTO admins (email, password, created_at, extra)
     VALUES ($1, $2, now(), $3)
     RETURNING *`,
    [email, password, JSON.stringify({})]
  );
  return result.rows[0];
};

const findByEmail = async (email) => {
  const result = await db.query("SELECT * FROM admins WHERE LOWER(email) = LOWER($1)", [email]);
  return result.rows[0] || null;
};

const findById = async (id) => {
  const result = await db.query("SELECT * FROM admins WHERE id = $1", [id]);
  return result.rows[0] || null;
};

const updateExtra = async (id, extra) => {
  const result = await db.query(
    `UPDATE admins
     SET extra = $1::jsonb,
         updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(extra || {}), id]
  );
  return result.rows[0] || null;
};

const listIds = async () => {
  const result = await db.query("SELECT id FROM admins");
  return result.rows.map((row) => row.id);
};

const normalizeUserType = (value) => {
  const next = String(value || "").trim().toLowerCase();
  if (next === "students" || next === "companies" || next === "all") return next;
  return "all";
};

const buildSearchPattern = (query) => {
  const normalized = String(query || "").trim();
  if (!normalized) return { query: "", pattern: "%%" };
  return { query: normalized, pattern: `%${normalized}%` };
};

const listUsersForBrowse = async ({ type, query, limit, offset }) => {
  const userType = normalizeUserType(type);
  const { query: normalizedQuery, pattern } = buildSearchPattern(query);

  const result = await db.query(
    `WITH users AS (
      SELECT
        s.id,
        'student'::text AS result_type,
        s.firstname,
        s.lastname,
        NULL::text AS name,
        s.email,
        s.status,
        s.country,
        s.city,
        s.phone,
        s."class" AS class_name,
        s.promotion,
        s.type AS student_type,
        NULL::text AS website,
        s.created_at
      FROM students s
      WHERE ($1::text IN ('all', 'students'))
        AND (
          $2::text = ''
          OR (
            COALESCE(s.firstname, '') || ' ' ||
            COALESCE(s.lastname, '') || ' ' ||
            COALESCE(s.email, '') || ' ' ||
            COALESCE(s.country, '') || ' ' ||
            COALESCE(s.city, '') || ' ' ||
            COALESCE(s.phone, '') || ' ' ||
            COALESCE(s."class", '') || ' ' ||
            COALESCE(s.promotion, '') || ' ' ||
            COALESCE(s.type, '')
          ) ILIKE $3
        )

      UNION ALL

      SELECT
        c.id,
        'company'::text AS result_type,
        NULL::text AS firstname,
        NULL::text AS lastname,
        c.name,
        c.email,
        c.status,
        c.country,
        c.city,
        c.phone,
        NULL::text AS class_name,
        NULL::text AS promotion,
        NULL::text AS student_type,
        c.website,
        c.created_at
      FROM companies c
      WHERE ($1::text IN ('all', 'companies'))
        AND (
          $2::text = ''
          OR (
            COALESCE(c.name, '') || ' ' ||
            COALESCE(c.email, '') || ' ' ||
            COALESCE(c.website, '') || ' ' ||
            COALESCE(c.country, '') || ' ' ||
            COALESCE(c.city, '') || ' ' ||
            COALESCE(c.phone, '') || ' ' ||
            COALESCE(c.address, '')
          ) ILIKE $3
        )
    )
    SELECT *
    FROM users
    ORDER BY created_at DESC NULLS LAST, COALESCE(name, firstname || ' ' || lastname) ASC
    LIMIT $4
    OFFSET $5`,
    [userType, normalizedQuery, pattern, limit, offset]
  );

  return result.rows;
};

const countUsersForBrowse = async ({ type, query }) => {
  const userType = normalizeUserType(type);
  const { query: normalizedQuery, pattern } = buildSearchPattern(query);

  const result = await db.query(
    `WITH users AS (
      SELECT s.id
      FROM students s
      WHERE ($1::text IN ('all', 'students'))
        AND (
          $2::text = ''
          OR (
            COALESCE(s.firstname, '') || ' ' ||
            COALESCE(s.lastname, '') || ' ' ||
            COALESCE(s.email, '') || ' ' ||
            COALESCE(s.country, '') || ' ' ||
            COALESCE(s.city, '') || ' ' ||
            COALESCE(s.phone, '') || ' ' ||
            COALESCE(s."class", '') || ' ' ||
            COALESCE(s.promotion, '') || ' ' ||
            COALESCE(s.type, '')
          ) ILIKE $3
        )

      UNION ALL

      SELECT c.id
      FROM companies c
      WHERE ($1::text IN ('all', 'companies'))
        AND (
          $2::text = ''
          OR (
            COALESCE(c.name, '') || ' ' ||
            COALESCE(c.email, '') || ' ' ||
            COALESCE(c.website, '') || ' ' ||
            COALESCE(c.country, '') || ' ' ||
            COALESCE(c.city, '') || ' ' ||
            COALESCE(c.phone, '') || ' ' ||
            COALESCE(c.address, '')
          ) ILIKE $3
        )
    )
    SELECT COUNT(*)::int AS total
    FROM users`,
    [userType, normalizedQuery, pattern]
  );

  return Number(result.rows[0]?.total || 0);
};

module.exports = {
  createAdmin,
  findByEmail,
  findById,
  updateExtra,
  listIds,
  listUsersForBrowse,
  countUsersForBrowse,
};
