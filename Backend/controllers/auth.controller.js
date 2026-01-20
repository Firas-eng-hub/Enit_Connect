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
