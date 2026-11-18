const { studentMapRepository } = require("../repositories");
const { serverError } = require("../utils/http");
const { createTtlCache } = require("../helpers/ttl-cache");

// Stats/options aggregate the whole filtered population: cache briefly.
const statsCache = createTtlCache({ ttlMs: 60_000, maxEntries: 200 });

// req.query has already passed validation.schemas.studentMapQuery.
const filtersOf = (q) => ({
  property: q.property,
  key: q.key || "",
  type: q.type,
  promotion: q.promotion || undefined,
  class: q.class || undefined,
  employed: Boolean(q.employed),
});

const parseNumbers = (value) => (value ? value.split(",").map(Number) : null);

const parseBbox = (value) => {
  const nums = parseNumbers(value);
  if (!nums) return null;
  const [south, west, north, east] = nums;
  const ok = Math.abs(south) <= 90 && Math.abs(north) <= 90 && south <= north
    && Math.abs(west) <= 180 && Math.abs(east) <= 180;
  return ok ? { south, west, north, east } : undefined;
};

const parseCell = (value) => {
  const nums = parseNumbers(value);
  if (!nums) return null;
  const [lat, lng] = nums;
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Opaque keyset cursor: base64url JSON of the last row's sort key.
const encodeCursor = (next) =>
  next ? Buffer.from(JSON.stringify([next.lastname, next.firstname, next.id])).toString("base64url") : null;

const decodeCursor = (value) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 3) return undefined;
    const [lastname, firstname, id] = parsed;
    if (typeof lastname !== "string" || typeof firstname !== "string" || !UUID.test(String(id))) return undefined;
    if (lastname.length > 200 || firstname.length > 200) return undefined;
    return { lastname, firstname, id };
  } catch {
    return undefined;
  }
};

const badRequest = (res) => res.status(400).send({ message: "Invalid map parameters." });

exports.getCells = async (req, res) => {
  try {
    const cells = await studentMapRepository.listCells(filtersOf(req.query));
    res.status(200).send(cells);
  } catch (err) {
    serverError(res, err);
  }
};

exports.getPeople = async (req, res) => {
  const bbox = parseBbox(req.query.bbox);
  const cell = parseCell(req.query.cell);
  const after = decodeCursor(req.query.cursor);
  if (bbox === undefined || cell === undefined || after === undefined) return badRequest(res);

  try {
    const { people, next } = await studentMapRepository.listPeople(filtersOf(req.query), {
      bbox,
      cell,
      after,
      limit: req.query.limit,
    });
    res.status(200).send({ data: people, nextCursor: encodeCursor(next) });
  } catch (err) {
    serverError(res, err);
  }
};

exports.getStats = async (req, res) => {
  const filters = filtersOf(req.query);
  try {
    const [stats, options] = await Promise.all([
      statsCache.wrap(`stats:${JSON.stringify(filters)}`, () => studentMapRepository.getStats(filters)),
      statsCache.wrap(`options:${filters.property}:${filters.key}`, () => studentMapRepository.getFilterOptions(filters)),
    ]);
    res.status(200).send({ stats, options });
  } catch (err) {
    serverError(res, err);
  }
};

// Exposed for tests.
exports._internals = { encodeCursor, decodeCursor, parseBbox, parseCell, statsCache };
