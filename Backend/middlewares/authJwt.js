const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

const VERIFY_OPTIONS = { algorithms: ["HS256"] };
const { adminRepository, studentRepository, companyRepository } = require("../repositories");
const { isUuid } = require("../utils/validation");

// Cookie configuration for JWT tokens (env-driven for production)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: process.env.COOKIE_SAMESITE || 'lax',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/',
  ...(process.env.COOKIE_DOMAIN && { domain: process.env.COOKIE_DOMAIN }),
};

const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
};

// Helper function to set auth cookies
exports.setAuthCookies = (res, accessToken, refreshToken, userType) => {
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
  res.cookie('userType', userType, cookieOptions); // HttpOnly: the client gets the role from /api/auth/check
};

// Refresh only the short-lived access token (refresh cookie left untouched)
exports.setAccessCookie = (res, accessToken, userType) => {
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('userType', userType, cookieOptions);
};

// Helper function to clear auth cookies.
// The clearing options MUST mirror the attributes used when the cookies were
// set (secure / sameSite / domain), otherwise the browser treats them as a
// different cookie and logout silently leaves the session in place.
exports.clearAuthCookies = (res) => {
  const { maxAge, ...clearOptions } = cookieOptions;
  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
  res.clearCookie('userType', clearOptions);
};

// Verify token from cookie or Authorization header (for backward compatibility)
exports.verifyToken = (req, res, next) => {
  // First try to get token from HTTP-only cookie
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header for backward compatibility
  if (!token && req.headers["authorization"]) {
    token = req.headers["authorization"].split(' ')[1];
  }

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, VERIFY_OPTIONS, (err, decoded) => {
    if (err) {
      // Token expired or invalid
      return res.status(401).send({ message: "Unauthorized! Token invalid or expired." });
    }
    if (!isUuid(decoded.id)) {
      return res.status(401).send({ message: "Unauthorized! Token invalid or expired." });
    }
    req.id = decoded.id;
    req.email = decoded.email;
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (!isUuid(req.id)) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
  adminRepository.findById(req.id)
    .then((admin) => {
      if (!admin) {
        res.status(401).send({ message: "Unauthorized!" });
      } else {
        req.userRole = "admin";
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Internal server error." });
    });
};

exports.isStudent = (req, res, next) => {
  if (!isUuid(req.id)) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
  studentRepository.findById(req.id)
    .then((student) => {
      if (!student) {
        res.status(401).send({ message: "Unauthorized!" });
      } else {
        req.userRole = "student";
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Internal server error." });
    });
};

exports.isCompany = (req, res, next) => {
  // Identity comes ONLY from the verified token, never from the query string.
  const companyId = req.id;
  if (!isUuid(companyId)) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
  companyRepository.findById(companyId)
    .then((company) => {
      if (!company) {
        res.status(401).send({ message: "Unauthorized!" });
      } else {
        req.userRole = "company";
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "Internal server error." });
    });
};

// Optional token verification - doesn't fail if token is missing (for public share links)
exports.verifyTokenOptional = (req, res, next) => {
  // First try to get token from HTTP-only cookie
  let token = req.cookies?.accessToken;

  // Fallback to Authorization header for backward compatibility
  if (!token && req.headers["authorization"]) {
    token = req.headers["authorization"].split(' ')[1];
  }

  // If no token, proceed without authentication (for public links)
  if (!token) {
    req.id = null;
    req.email = null;
    return next();
  }

  // If token exists, verify it
  jwt.verify(token, config.secret, VERIFY_OPTIONS, (err, decoded) => {
    if (err) {
      // Invalid token - proceed without authentication
      req.id = null;
      req.email = null;
      return next();
    }
    if (!isUuid(decoded.id)) {
      req.id = null;
      req.email = null;
      return next();
    }
    req.id = decoded.id;
    req.email = decoded.email;
    next();
  });
};

module.exports = exports;
