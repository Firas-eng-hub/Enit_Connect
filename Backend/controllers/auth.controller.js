const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const authJwt = require("../middlewares/authJwt");
const {
  refreshTokenRepository,
  studentRepository,
  companyRepository,
  adminRepository,
} = require("../repositories");
const { isUuid } = require("../utils/validation");

const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailNotifications: true,
  pushNotifications: true,
};

const parseExtra = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (err) {
    return {};
  }
};

const getNotificationPreferences = (extraValue) => {
  const extra = parseExtra(extraValue);
  const stored = extra?.preferences?.notifications || {};
  return {
    emailNotifications:
      typeof stored.emailNotifications === "boolean"
        ? stored.emailNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.emailNotifications,
    pushNotifications:
      typeof stored.pushNotifications === "boolean"
        ? stored.pushNotifications
        : DEFAULT_NOTIFICATION_PREFERENCES.pushNotifications,
  };
};

const applyNotificationPreferences = (extraValue, nextPreferences) => {
  const extra = parseExtra(extraValue);
  const current = getNotificationPreferences(extra);
  return {
    ...extra,
    preferences: {
      ...(extra.preferences || {}),
      notifications: {
        ...current,
        ...nextPreferences,
      },
    },
  };
};

const getCurrentUser = async ({ id, preferredType }) => {
  if (!isUuid(id)) return null;
  const requested = String(preferredType || "").trim().toLowerCase();
  const types = ["student", "company", "admin"];
  const ordered = requested
    ? [requested, ...types.filter((type) => type !== requested)]
    : types;

  for (const type of ordered) {
    if (type === "student") {
      const user = await studentRepository.findById(id);
      if (user) return { type, user };
    }
    if (type === "company") {
      const user = await companyRepository.findById(id);
      if (user) return { type, user };
    }
    if (type === "admin") {
      const user = await adminRepository.findById(id);
      if (user) return { type, user };
    }
  }

  return null;
};

// Check authentication status (for frontend guards)
exports.checkAuth = async (req, res) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      // Return 200 with authenticated: false (not 401) so frontend can handle gracefully
      return res.status(200).json({ authenticated: false });
    }

    jwt.verify(token, config.secret, async (err, decoded) => {
      if (err) {
        return res.status(200).json({ authenticated: false, message: "Token invalid or expired" });
      }

      // Get user info based on userType cookie
      const userType = req.cookies?.userType;
      let user;

      try {
        if (!decoded?.id || !isUuid(decoded.id)) {
          return res.status(200).json({ authenticated: false, message: "Invalid user id." });
        }

        if (userType === 'student') {
          user = await studentRepository.findById(decoded.id);
        } else if (userType === 'company') {
          user = await companyRepository.findById(decoded.id);
        } else if (userType === 'admin') {
          user = await adminRepository.findById(decoded.id);
        }
      } catch (err) {
        return res.status(500).json({ authenticated: false, message: err.message });
      }

      if (!user) {
        return res.status(200).json({ authenticated: false });
      }

        return res.status(200).json({
        authenticated: true,
        userType: userType,
        user: {
          id: user.id,
          email: user.email,
          name: user.firstname ? `${user.firstname} ${user.lastname}` : user.name || 'Administrator'
        }
      });
    });
  } catch (err) {
    console.error("Auth check failed:", err);
    return res.status(500).json({ authenticated: false, message: "Internal server error" });
  }
};

exports.getPreferences = async (req, res) => {
  try {
    const current = await getCurrentUser({
      id: req.id,
      preferredType: req.cookies?.userType,
    });
    if (!current) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    return res.status(200).send({
      notifications: getNotificationPreferences(current.user.extra),
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

exports.updatePreferences = async (req, res) => {
  try {
    const current = await getCurrentUser({
      id: req.id,
      preferredType: req.cookies?.userType,
    });
    if (!current) {
      return res.status(401).send({ message: "Unauthorized!" });
    }

    const patch = {};
    if (typeof req.body.emailNotifications === "boolean") {
      patch.emailNotifications = req.body.emailNotifications;
    }
    if (typeof req.body.pushNotifications === "boolean") {
      patch.pushNotifications = req.body.pushNotifications;
    }

    const mergedExtra = applyNotificationPreferences(current.user.extra, patch);

    let updated = null;
    if (current.type === "student") {
      updated = await studentRepository.updateExtra(current.user.id, mergedExtra);
    } else if (current.type === "company") {
      updated = await companyRepository.updateExtra(current.user.id, mergedExtra);
    } else if (current.type === "admin") {
      updated = await adminRepository.updateExtra(current.user.id, mergedExtra);
    }

    if (!updated) {
      return res.status(404).send({ message: "User not found." });
    }

    return res.status(200).send({
      message: "Preferences updated.",
      notifications: getNotificationPreferences(updated.extra),
    });
  } catch (err) {
    return res.status(500).send({ message: err.message || err });
  }
};

// Refresh access token using refresh token from cookie
exports.refreshToken = async (req, res) => {
  // Get refresh token from cookie or body (backward compatibility)
  const requestToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!requestToken) {
    authJwt.clearAuthCookies(res);
    return res.sendStatus(401);
  }

  try {
    // Find refresh token in database
    const refreshToken = await refreshTokenRepository.findByToken(requestToken);

    if (!refreshToken) {
      // Clear invalid cookies
      authJwt.clearAuthCookies(res);
      return res.sendStatus(401);
    }

    // Check if token is expired
    if (new Date(refreshToken.expires_at) < new Date()) {
      await refreshTokenRepository.deleteById(refreshToken.id);
      authJwt.clearAuthCookies(res);
      return res.sendStatus(401);
    }

    // Get user based on userType
    let user;
    let userType;

    if (refreshToken.user_type === 'Student') {
      user = await studentRepository.findById(refreshToken.user_id);
      userType = 'student';
    } else if (refreshToken.user_type === 'Company') {
      user = await companyRepository.findById(refreshToken.user_id);
      userType = 'company';
    } else if (refreshToken.user_type === 'Admin') {
      user = await adminRepository.findById(refreshToken.user_id);
      userType = 'admin';
    }

    if (!user) {
      authJwt.clearAuthCookies(res);
      return res.sendStatus(401);
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { email: user.email, id: user.id },
      config.secret,
      { expiresIn: "24h" }
    );

    // Set new access token in cookie
    authJwt.setAuthCookies(res, newAccessToken, requestToken, userType);

    return res.status(200).json({
      message: "Token refreshed successfully",
      userType: userType
    });

  } catch (err) {
    console.error("Refresh token failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Logout - clear cookies and invalidate refresh token
exports.logout = async (req, res) => {
  const requestToken = req.cookies?.refreshToken || req.body?.refreshToken;

  try {
    // Clear all auth cookies
    authJwt.clearAuthCookies(res);

    // Delete refresh token from database if provided
    if (requestToken) {
      await refreshTokenRepository.deleteByToken(requestToken);
    }

    return res.status(200).json({ message: "Logged out successfully!" });
  } catch (err) {
    console.error("Logout failed:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
