const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const trimmer = require('express-trimmer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

dotenv.config({ path: '.env' })

const student_routes = require("./routes/student.routes");
const admin_routes = require("./routes/admin.routes");
const company_routes = require("./routes/company.routes");
const offer_routes = require("./routes/offer.routes");
const auth_routes = require("./routes/auth.routes");
const document_routes = require("./routes/document.routes");
const mail_routes = require("./routes/mail.routes");
const stats_routes = require("./routes/stats.routes");
const matching_routes = require("./routes/matching.routes");
const search_routes = require("./routes/search.routes");
const companyStats_routes = require("./routes/companyStats.routes");
const app = express();
const path = require('path');

// ============================================
// Trust Proxy (required when behind nginx/load balancer)
// ============================================
// Only trust X-Forwarded-For from private-network proxies (nginx / platform LB),
// so a client hitting the backend directly cannot spoof its IP to dodge rate limits.
// Override with TRUST_PROXY (e.g. "1", "loopback", or a CIDR list) if your topology differs.
const parseTrustProxy = (value) => {
  if (value === undefined || value === "") return "loopback, linklocal, uniquelocal";
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
};
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

// ============================================
// Security Middleware
// ============================================

// Set security HTTP headers
// The API only returns JSON / files, so it gets the strictest possible CSP.
// (The SPA's own CSP is set by nginx.)
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Body parser with size limits (prevent large payload attacks)
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Prevent HTTP Parameter Pollution.
// MUST come after the body parsers: hpp inspects req.body at call time, so
// mounting it earlier silently skipped body protection entirely.
app.use(hpp());

// Cookie parser for HTTP-only JWT cookies
app.use(cookieParser());

// CORS configuration - MUST come before rate limiting to ensure CORS headers on all responses
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
  credentials: true, // Required for cookies
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// CSRF protection for cookie-authenticated, state-changing requests.
// Must come after CORS so that blocked responses still carry CORS headers.
const { csrfGuard } = require('./middlewares/csrfGuard');
app.use(csrfGuard);

// Rate limiting - prevent brute force attacks (after CORS so rate limit responses include CORS headers)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for login endpoints (failed attempts only)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // Higher limit in development
  message: { message: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use(['/api/student/login', '/api/company/login', '/api/admin/login', '/api/admin'], (req, res, next) => {
  // '/api/admin' (exact, POST) is a legacy alias of the admin login route
  if (req.method !== 'POST' || (req.baseUrl === '/api/admin' && req.path !== '/')) return next();
  return authLimiter(req, res, next);
});

// Trim whitespace from request body
app.use(trimmer);

//Home Page
app.get("/", (req, res) => {
  res.json({ message: "Welcome to TIC-ENIT API." });
});

// Health check endpoint for Docker
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Serve uploaded files statically
// Uploaded files are untrusted: never let the browser render them as active content.
const INLINE_UPLOAD_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".pdf"]);
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  dotfiles: "deny",
  index: false,
  setHeaders: (res, filePath) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    if (!INLINE_UPLOAD_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
      res.setHeader("Content-Disposition", "attachment");
    }
  }
}));

//Routes
// Mount API routes
app.use("/api/auth", auth_routes);
app.use("/api/admin", admin_routes);
app.use("/api/student", student_routes);
app.use("/api/company", company_routes);
app.use("/api/offers", offer_routes);
app.use("/api/documents", document_routes);
app.use("/api/mail", mail_routes);
app.use("/api/admin/stats", stats_routes);
app.use("/api/student/matching", matching_routes);
app.use("/api/search", search_routes);
app.use("/api/company/stats", companyStats_routes);

// ============================================
// Error Handling Middleware (must be last)
// ============================================
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
