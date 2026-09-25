// Fail fast at startup rather than at the first sign-in attempt: an unset or
// trivially short JWT_SECRET otherwise lets the server boot normally and then
// 500 on every login, or (worse) sign tokens with a guessable key.
// Mirrors the DATABASE_URL guard in db/index.js.
const MIN_SECRET_LENGTH = 32;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not set.");
}

if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
  throw new Error(
    `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters in production.`
  );
}

module.exports = {
  secret: process.env.JWT_SECRET,
};
