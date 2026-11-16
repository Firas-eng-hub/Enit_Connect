const rateLimit = require("express-rate-limit");

const ipKey = (req) =>
  typeof rateLimit.ipKeyGenerator === "function" ? rateLimit.ipKeyGenerator(req.ip) : req.ip;

// Brute-force guard for 6-digit email verification codes (keyed by IP + email,
// plus a coarser per-IP cap so rotating the email doesn't help).
const verifyPerEmail = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKey(req)}|${String(req.body?.email || "").toLowerCase()}`,
  message: { message: "Too many verification attempts, please try again later." },
});

const verifyPerIp = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts, please try again later." },
});

const verifyLimiter = [verifyPerIp, verifyPerEmail];

module.exports = { verifyLimiter };
