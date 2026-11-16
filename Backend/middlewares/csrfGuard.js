// ============================================
// CSRF Origin Guard
// ============================================
//
// Authentication is cookie-based, and production runs with
// COOKIE_SAMESITE=none (frontend and backend are on different origins), so
// SameSite provides no CSRF protection there.
//
// CORS alone does not close this: it governs whether a response may be READ,
// not whether the request is SENT. A cross-site POST with a CORS-"simple"
// content type (application/x-www-form-urlencoded, text/plain, or
// multipart/form-data) is dispatched with the victim's cookies and no
// preflight, so the side effect happens regardless of the CORS policy.
//
// Defence: for every state-changing method, require that the browser-supplied
// Origin (or Referer, for older clients) matches an allowlisted origin.
// Browsers always attach Origin to cross-site requests and cannot be made to
// forge it, so this is a reliable check.
//
// A request with NEITHER header is not a browser-driven cross-site request
// (curl, server-to-server, health checks, mobile clients), and no browser
// attaches ambient cookies to those on an attacker's behalf, so it is allowed
// through. This keeps non-browser API clients and the existing test suite
// working while closing the browser CSRF path.
//
// A header that is PRESENT but not a parseable origin is rejected, never
// treated as absent. Browsers send the literal `Origin: null` from opaque
// contexts (sandboxed iframes, data: URLs), which an attacker controls and can
// pair with a no-referrer policy; treating that as "no header" would bypass
// the guard entirely.

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.origin;
  } catch (err) {
    return null;
  }
};

const getAllowedOrigins = () => {
  const configured = [
    process.env.FRONTEND_URL,
    process.env.APP_URL,
    process.env.BASE_URL,
  ];

  const allowed = new Set();
  for (const entry of configured) {
    const origin = normalizeOrigin(entry);
    if (origin) allowed.add(origin);
  }
  return allowed;
};

const csrfGuard = (req, res, next) => {
  if (!STATE_CHANGING_METHODS.has(req.method)) {
    return next();
  }

  const rawOrigin = req.headers.origin;
  const rawReferer = req.headers.referer;

  // No browser-supplied origin: not a cross-site browser request.
  if (!rawOrigin && !rawReferer) {
    return next();
  }

  // Origin takes precedence; Referer is only a fallback for older clients.
  const origin = normalizeOrigin(rawOrigin || rawReferer);

  const allowed = getAllowedOrigins();

  // Same-origin requests (the API calling itself) are always acceptable.
  const selfOrigin = normalizeOrigin(
    `${req.protocol}://${req.get("host") || ""}`
  );
  if (selfOrigin) allowed.add(selfOrigin);

  if (origin && allowed.has(origin)) {
    return next();
  }

  console.warn("[SECURITY] Cross-origin state-changing request blocked:", {
    ip: req.ip,
    method: req.method,
    path: req.originalUrl,
    origin: origin || String(rawOrigin || rawReferer).slice(0, 200),
    timestamp: new Date().toISOString(),
  });

  return res.status(403).send({ message: "Cross-origin request blocked." });
};

module.exports = { csrfGuard, getAllowedOrigins };
