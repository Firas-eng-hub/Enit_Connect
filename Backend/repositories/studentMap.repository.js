const db = require("../db");
const { pickAllowed } = require("../utils/validation");

// Columns the search form may filter on (prefix ILIKE, trigram-indexed).
const SEARCHABLE_COLUMNS = {
  firstname: "firstname",
  lastname: "lastname",
  country: "country",
  city: "city",
  class: "\"class\"",
  promotion: "promotion",
  type: "type",
};

// Directory-safe person fields; never email, phone, address or raw coordinates.
const personColumns = (a) => `${a}.id, ${a}.firstname, ${a}.lastname, ${a}.picture, ${a}.type,
  ${a}.promotion, ${a}."class", ${a}.work_at, ${a}.city, ${a}.country, ${a}.lat_city, ${a}.lng_city`;

const toPerson = (row) => ({
  id: row.id,
  name: `${row.firstname || ""} ${row.lastname || ""}`.trim(),
  picture: row.picture || null,
  type: row.type || null,
  promotion: row.promotion || null,
  class: row.class || null,
  workAt: row.work_at || null,
  city: row.city || null,
  country: row.country || null,
  lat: row.lat_city,
  lng: row.lng_city,
});

/**
 * WHERE clause shared by every map query. Matches the partial indexes from
 * migration 017 (Active + located). All user input is bound as parameters;
 * the only interpolated identifier comes from SEARCHABLE_COLUMNS.
 *
 * @param {object} q validated query (see studentMapQuery schema)
 * @param {string} a table alias
 * @param {Array} params shared parameter list (appended to)
 */
const buildMapWhere = (q, a, params) => {
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const conditions = [
    `${a}.status = 'Active'`,
    `${a}.lat_city IS NOT NULL`,
    `${a}.lng_city IS NOT NULL`,
  ];

  const column = pickAllowed(SEARCHABLE_COLUMNS, q.property);
  if (column && q.key) conditions.push(`${a}.${column} ILIKE ${add(`${q.key}%`)}`);
  if (q.type) conditions.push(`${a}.type = ${add(q.type)}`);
  if (q.promotion) conditions.push(`lower(btrim(${a}.promotion)) = lower(${add(q.promotion)})`);
  if (q.class) conditions.push(`lower(btrim(${a}."class")) = lower(${add(q.class)})`);
  if (q.employed) conditions.push(`coalesce(btrim(${a}.work_at), '') <> ''`);

  return conditions.join(" AND ");
};

const MAX_CELLS = 20000;

/** One row per city cell; single-person cells carry that person's summary. */
const listCells = async (q) => {
  const params = [];
  const where = buildMapWhere(q, "s", params);
  const whereInner = buildMapWhere(q, "p", params);
  const result = await db.query(
    `WITH cells AS (
       SELECT s.lat_city, s.lng_city, count(*)::int AS count, max(btrim(s.city)) AS label
       FROM students s
       WHERE ${where}
       GROUP BY s.lat_city, s.lng_city
       LIMIT ${MAX_CELLS}
     )
     SELECT c.lat_city AS lat, c.lng_city AS lng, c.count, c.label AS cell_label, one.*
     FROM cells c
     LEFT JOIN LATERAL (
       SELECT ${personColumns("p")}
       FROM students p
       WHERE c.count = 1 AND p.lat_city = c.lat_city AND p.lng_city = c.lng_city AND ${whereInner}
       LIMIT 1
     ) one ON true`,
    params
  );
  return result.rows.map((row) => ({
    lat: row.lat,
    lng: row.lng,
    count: row.count,
    label: row.cell_label || null,
    person: row.count === 1 && row.id ? toPerson(row) : null,
  }));
};

/** Keyset-paginated people, ordered by name, optionally limited to a bbox or a cell. */
const listPeople = async (q, { bbox, cell, after, limit }) => {
  const params = [];
  const add = (value) => {
    params.push(value);
    return `$${params.length}`;
  };
  const conditions = [buildMapWhere(q, "s", params)];

  if (cell) {
    conditions.push(`s.lat_city = ${add(cell.lat)} AND s.lng_city = ${add(cell.lng)}`);
  } else if (bbox) {
    conditions.push(`s.lat_city BETWEEN ${add(bbox.south)} AND ${add(bbox.north)}`);
    // A bbox crossing the antimeridian has west > east.
    conditions.push(
      bbox.west <= bbox.east
        ? `s.lng_city BETWEEN ${add(bbox.west)} AND ${add(bbox.east)}`
        : `(s.lng_city >= ${add(bbox.west)} OR s.lng_city <= ${add(bbox.east)})`
    );
  }
  if (after) {
    conditions.push(
      `(lower(s.lastname), lower(s.firstname), s.id) > (${add(after.lastname)}, ${add(after.firstname)}, ${add(after.id)}::uuid)`
    );
  }

  const result = await db.query(
    `SELECT ${personColumns("s")}
     FROM students s
     WHERE ${conditions.join(" AND ")}
     ORDER BY lower(s.lastname), lower(s.firstname), s.id
     LIMIT ${add(limit + 1)}`,
    params
  );

  const rows = result.rows.slice(0, limit);
  const last = rows[rows.length - 1];
  return {
    people: rows.map(toPerson),
    next:
      result.rows.length > limit && last
        ? { lastname: (last.lastname || "").toLowerCase(), firstname: (last.firstname || "").toLowerCase(), id: last.id }
        : null,
  };
};

/** Totals and top-3 rankings for the filtered population. */
// Three independent scans run concurrently (each can use a parallel plan);
// hash GROUP BY instead of count(DISTINCT)/mode(), which both sort.
const getStats = async (q) => {
  const totalsParams = [];
  const totalsWhere = buildMapWhere(q, "s", totalsParams);
  const totalsWhereInner = buildMapWhere(q, "s", totalsParams);

  const rank = (col) => {
    const params = [];
    const where = buildMapWhere(q, "s", params);
    // max() of the spellings in a group: picks a capitalised form ("Tunis")
    // over lowercase ("tunis") under the usual collations.
    return db
      .query(
        `SELECT max(btrim(s.${col})) AS label, count(*)::int AS count
         FROM students s
         WHERE ${where} AND coalesce(btrim(s.${col}), '') <> ''
         GROUP BY lower(btrim(s.${col}))
         ORDER BY count DESC, label
         LIMIT 3`,
        params
      )
      .then((r) => r.rows);
  };

  const [totals, topCities, topEmployers] = await Promise.all([
    db
      .query(
        `SELECT count(*)::int AS total,
           (SELECT count(*) FROM (
              SELECT 1 FROM students s
              WHERE ${totalsWhereInner} AND coalesce(btrim(s.country), '') <> ''
              GROUP BY lower(btrim(s.country))
           ) c)::int AS countries
         FROM students s
         WHERE ${totalsWhere}`,
        totalsParams
      )
      .then((r) => r.rows[0] || {}),
    rank("city"),
    rank("work_at"),
  ]);

  return {
    total: totals.total || 0,
    countries: totals.countries || 0,
    topCities,
    topEmployers,
  };
};

const MAX_OPTIONS = 200;

/** Dropdown options: depend on the search only, not on the other filters. */
const getFilterOptions = async (q) => {
  const params = [];
  const where = buildMapWhere({ property: q.property, key: q.key }, "s", params);
  const distinct = (col) => `(
    SELECT coalesce(json_agg(v ORDER BY v DESC), '[]'::json) FROM (
      SELECT DISTINCT btrim(${col}) AS v FROM students s
      WHERE ${where} AND coalesce(btrim(${col}), '') <> ''
      LIMIT ${MAX_OPTIONS}
    ) d
  )`;
  const result = await db.query(
    `SELECT ${distinct("s.promotion")} AS promotions, ${distinct("s.\"class\"")} AS classes`,
    params
  );
  const row = result.rows[0] || {};
  return {
    promotions: row.promotions || [],
    classes: (row.classes || []).slice().sort((a, b) => String(a).localeCompare(String(b))),
  };
};

module.exports = {
  SEARCHABLE_COLUMNS,
  buildMapWhere,
  listCells,
  listPeople,
  getStats,
  getFilterOptions,
};
