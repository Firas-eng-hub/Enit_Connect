const express = require("express");
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require("../controllers/auth.controller");

// Rate limiter for refresh endpoint
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 refresh attempts per window
  message: 'Too many refresh requests, please try again later.',
});

// Refresh access token
router.post("/refresh", refreshLimiter, authController.refreshToken);

// Logout (invalidate refresh token)
router.post("/logout", authController.logout);

module.exports = router;
