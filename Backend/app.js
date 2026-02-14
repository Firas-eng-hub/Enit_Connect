const express = require("express");
const bodyParser = require("body-parser");
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
const app = express();
const path = require('path');

// ============================================
// Trust Proxy (required when behind nginx/load balancer)
// ============================================
app.set('trust proxy', 1);

// ============================================
// Security Middleware
// ============================================

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for file uploads
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Prevent HTTP Parameter Pollution
app.use(hpp());

// Body parser with size limits (prevent large payload attacks)
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

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

// Rate limiting - prevent brute force attacks (after CORS so rate limit responses include CORS headers)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // Higher limit in development
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
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
app.use("/uploads", express.static(path.join(__dirname, "uploads"), {
  setHeaders: (res) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
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

// ============================================
// Error Handling Middleware (must be last)
// ============================================
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

module.exports = app;
