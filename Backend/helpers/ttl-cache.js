// Tiny in-process TTL cache for expensive, slightly-stale-tolerant reads
// (e.g. map stats). Per instance only: with several backend replicas each keeps
// its own copy, which is fine for data that may lag by `ttlMs`.
const createTtlCache = ({ ttlMs = 60_000, maxEntries = 200, now = () => Date.now() } = {}) => {
  const entries = new Map();

  const get = (key) => {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now()) {
      entries.delete(key);
      return undefined;
    }
    return entry.value;
  };

  const set = (key, value) => {
    entries.delete(key); // re-insert so Map order tracks recency
    entries.set(key, { value, expiresAt: now() + ttlMs });
    while (entries.size > maxEntries) {
      entries.delete(entries.keys().next().value);
    }
  };

  /** Return the cached value, or compute, cache and return it. */
  const wrap = async (key, compute) => {
    const hit = get(key);
    if (hit !== undefined) return hit;
    const value = await compute();
    set(key, value);
    return value;
  };

  return { get, set, wrap, clear: () => entries.clear(), size: () => entries.size };
};

module.exports = { createTtlCache };
