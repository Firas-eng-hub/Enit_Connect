const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const authJwt = require("../middlewares/authJwt");
const RefreshToken = db.refreshToken;
const Student = db.student;
const Company = db.company;
const Admin = db.admin;

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

      if (userType === 'student') {
        user = await Student.findById(decoded.id).select('-password');
      } else if (userType === 'company') {
        user = await Company.findById(decoded.id).select('-password');
      } else if (userType === 'admin') {
        user = await Admin.findById(decoded.id).select('-password');
      }

      if (!user) {
        return res.status(200).json({ authenticated: false });
      }

      return res.status(200).json({
        authenticated: true,
        userType: userType,
        user: {
          id: user._id,
          email: user.email,
          name: user.firstname ? `${user.firstname} ${user.lastname}` : user.name || 'Administrator'
        }
      });
    });
  } catch (err) {
    return res.status(500).json({ authenticated: false, message: err.message });
  }
};

// Refresh access token using refresh token from cookie
exports.refreshToken = async (req, res) => {
  // Get refresh token from cookie or body (backward compatibility)
  const requestToken = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh token is required!" });
  }

  try {
    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({ token: requestToken });

    if (!refreshToken) {
      // Clear invalid cookies
      authJwt.clearAuthCookies(res);
      return res.status(403).json({ message: "Invalid refresh token!" });
    }

    // Check if token is expired
    if (RefreshToken.verifyExpiration(refreshToken)) {
      await RefreshToken.findByIdAndDelete(refreshToken._id);
      authJwt.clearAuthCookies(res);
      return res.status(403).json({
        message: "Refresh token expired. Please login again."
      });
    }

    // Get user based on userType
    let user;
    let userType;

    if (refreshToken.userType === 'Student') {
      user = await Student.findById(refreshToken.userId);
      userType = 'student';
    } else if (refreshToken.userType === 'Company') {
      user = await Company.findById(refreshToken.userId);
      userType = 'company';
    } else if (refreshToken.userType === 'Admin') {
      user = await Admin.findById(refreshToken.userId);
      userType = 'admin';
    }

    if (!user) {
      authJwt.clearAuthCookies(res);
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { email: user.email, id: user._id },
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
    return res.status(500).json({ message: "Internal server error", error: err.message });
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
      await RefreshToken.findOneAndDelete({ token: requestToken });
    }

    return res.status(200).json({ message: "Logged out successfully!" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
