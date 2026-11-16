// JWT signing configuration.
// Fails fast at boot when the secret is missing, short, or a known placeholder,
// so the app can never run with a guessable signing key (pentest M-06).

const MIN_SECRET_LENGTH = 32;

const KNOWN_WEAK_SECRETS = [
  "azerty123",
  "your-super-secret-jwt-key-change-me",
  "change-me",
  "changeme",
  "secret",
  "jwt_secret",
  "your_jwt_secret",
];

// Substrings found in the placeholder values shipped in the repo's example env files / docs.
const PLACEHOLDER_MARKERS = [
  "change-me",
  "changeme",
  "change-this",
  "change_this",
  "replace_with",
  "replace-with",
  "your-super-secret",
  "your-secret",
  "your_secret",
  "your-strong-secret",
  "your_jwt_secret",
];

const validateSecret = (secret) => {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new Error("JWT_SECRET is not set. Refusing to start.");
  }
  const lowered = secret.toLowerCase();
  if (KNOWN_WEAK_SECRETS.includes(lowered) || PLACEHOLDER_MARKERS.some((m) => lowered.includes(m))) {
    throw new Error("JWT_SECRET is a known placeholder value. Set a strong random secret.");
  }
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`);
  }
  return secret;
};

module.exports = {
  secret: validateSecret(process.env.JWT_SECRET),
  validateSecret,
};
