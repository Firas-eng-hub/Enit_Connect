/**
 * Express App Test Helper
 * Sets up Express app for integration testing
 */

const express = require('express');
const helmet = require('helmet');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');

/**
 * Create a test Express app with middleware
 * @param {Object} options - Configuration options
 * @returns {express.Application} Configured Express app
 */
function createTestApp(options = {}) {
  const app = express();

  // Trust proxy for testing
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(hpp());

  // Body parsing
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.use(cookieParser());

  // CORS for testing (allow all origins)
  app.use(cors({
    origin: '*',
    credentials: true,
  }));

  // Rate limiting disabled for tests by default
  if (options.rateLimit) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: options.rateLimitMax || 100,
    });
    app.use(limiter);
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });

  return app;
}

/**
 * Attach routes to test app
 * @param {express.Application} app - Express app
 * @param {Function} routeSetup - Function that sets up routes
 * @returns {express.Application} App with routes attached
 */
function attachRoutes(app, routeSetup) {
  routeSetup(app);
  return app;
}

/**
 * Create error handling middleware for testing
 * @returns {Function} Express error handler
 */
function createErrorHandler() {
  return (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(status).json({
      status,
      message,
      error: process.env.NODE_ENV === 'test' ? err : undefined,
    });
  };
}

/**
 * Attach error handler to app
 * @param {express.Application} app - Express app
 * @returns {express.Application} App with error handler
 */
function attachErrorHandler(app) {
  app.use(createErrorHandler());
  return app;
}

module.exports = {
  createTestApp,
  attachRoutes,
  createErrorHandler,
  attachErrorHandler,
};
