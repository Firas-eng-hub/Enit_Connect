const crypto = require("crypto");

const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const MAX_ATTEMPTS = parseNumber(process.env.VERIFICATION_MAX_ATTEMPTS, 5);
const CODE_TTL_MINUTES = parseNumber(process.env.VERIFICATION_CODE_TTL_MINUTES, 15);

// Cryptographically secure 6-digit code (pentest M-09: was Math.random()).
const generateVerificationCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const getVerificationExpiry = () =>
  new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

const getVerificationLimits = () => ({
  maxAttempts: MAX_ATTEMPTS,
  ttlMinutes: CODE_TTL_MINUTES,
});

module.exports = {
  generateVerificationCode,
  getVerificationExpiry,
  getVerificationLimits,
};
