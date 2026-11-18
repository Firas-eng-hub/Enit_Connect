// Shared limit/offset parsing for list endpoints: never trust client paging.
const parseLimit = (value, fallback = 50, max = 100) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), 1), max);
};

const parseOffset = (value, fallback = 0, max = 100000) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  // Deep OFFSETs still scan every skipped row; cap them.
  return Math.min(Math.max(Math.floor(parsed), 0), max);
};

module.exports = { parseLimit, parseOffset };
