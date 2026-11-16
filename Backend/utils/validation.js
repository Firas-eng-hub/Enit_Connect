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

// Safe allowlist lookup for user-supplied keys.
//
// `map[userKey]` reaches inherited properties: "constructor", "toString",
// "valueOf" and "__proto__" all return truthy non-values that pass a simple
// falsiness check, and any prototype pollution would return attacker data.
// Several call sites interpolate the result directly into SQL, so the lookup
// must only ever see the map's OWN keys.
const pickAllowed = (map, key) =>
  typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key)
    ? map[key]
    : null;

module.exports = {
  isUuid,
  parseJson,
  pickAllowed,
};
