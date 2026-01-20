const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value) => typeof value === "string" && UUID_REGEX.test(value);

const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
};

module.exports = {
  isUuid,
  parseJson,
};
