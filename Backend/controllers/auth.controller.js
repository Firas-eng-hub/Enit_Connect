const jwt = require("jsonwebtoken");
const config = require("../config/auth.config");
const db = require("../models");
const RefreshToken = db.refreshToken;
const Student = db.student;
const Company = db.company;
const Admin = db.admin;

// Refresh access token using refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(403).json({ message: "Refresh token is required!" });
  }

  try {
    // Find refresh token in database
    const refreshToken = await RefreshToken.findOne({ token: requestToken });

    if (!refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token!" });
    }

    // Check if token is expired
    if (RefreshToken.verifyExpiration(refreshToken)) {
      await RefreshToken.findByIdAndDelete(refreshToken._id);
      return res.status(403).json({
        message: "Refresh token expired. Please login again."
      });
    }

    // Get user based on userType
    let user;
    let userModel;
    
    if (refreshToken.userType === 'Student') {
      user = await Student.findById(refreshToken.userId);
      userModel = 'Student';
    } else if (refreshToken.userType === 'Company') {
      user = await Company.findById(refreshToken.userId);
      userModel = 'Company';
    } else if (refreshToken.userType === 'Admin') {
      user = await Admin.findById(refreshToken.userId);
      userModel = 'Admin';
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { email: user.email, id: user._id },
      config.secret,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: requestToken // Return same refresh token
    });

  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

// Logout - invalidate refresh token
exports.logout = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (!requestToken) {
    return res.status(400).json({ message: "Refresh token is required!" });
  }

  try {
    await RefreshToken.findOneAndDelete({ token: requestToken });
    return res.status(200).json({ message: "Logged out successfully!" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
