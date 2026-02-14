const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require("../controllers/auth.controller");
const { authJwt, validation } = require("../middlewares");

// Rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  message: 'Too many auth requests, please try again later.',
});

// Check authentication status (for frontend guards)
router.get("/check", authController.checkAuth);

// Notification/system preferences
router.get("/preferences", authJwt.verifyToken, authController.getPreferences);
router.patch(
  "/preferences",
  authJwt.verifyToken,
  validation.validate(validation.schemas.authPreferences),
  authController.updatePreferences
);

// Refresh access token
router.post("/refresh", authLimiter, authController.refreshToken);

// Logout (clear cookies and invalidate refresh token)
router.post("/logout", authController.logout);

module.exports = router;
