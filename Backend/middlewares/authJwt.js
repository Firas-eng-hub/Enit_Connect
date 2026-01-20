const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");
const { adminRepository, studentRepository, companyRepository } = require("../repositories");
const { isUuid } = require("../utils/validation");

const getCookieOptions = () => {
  const secure = process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  return {
    httpOnly: true,        // Prevents JavaScript access (XSS protection)
    secure,               // Only use secure cookies over HTTPS
    sameSite: 'lax',      // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    path: '/'
  };
};

const getRefreshCookieOptions = () => ({
  ...getCookieOptions(),
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
});

// Helper function to set auth cookies
exports.setAuthCookies = (res, accessToken, refreshToken, userType) => {
  const cookieOptions = getCookieOptions();
  res.cookie('accessToken', accessToken, cookieOptions);
  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());
  res.cookie('userType', userType, { ...cookieOptions, httpOnly: false }); // Allow JS to read user type
};

// Helper function to clear auth cookies
exports.clearAuthCookies = (res) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.clearCookie('userType', { path: '/' });
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

  jwt.verify(token, config.secret, (err, decoded) => {
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
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "error" + err.message });
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
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "error" + err.message });
    });
};

exports.isCompany = (req, res, next) => {
  const companyId = req.query.id || req.id;
  if (!isUuid(companyId)) {
    return res.status(401).send({ message: "Unauthorized!" });
  }
  companyRepository.findById(companyId)
    .then((company) => {
      if (!company) {
        res.status(401).send({ message: "Unauthorized!" });
      } else {
        next();
      }
    })
    .catch((err) => {
      res.status(500).send({ message: "error " + err.message });
    });
};

module.exports = exports;
