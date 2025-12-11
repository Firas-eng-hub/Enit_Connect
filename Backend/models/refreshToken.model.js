const mongoose = require('mongoose');
const crypto = require('crypto');

const RefreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'userType'
  },
  userType: {
    type: String,
    required: true,
    enum: ['Student', 'Company', 'Admin']
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic deletion of expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create refresh token
RefreshTokenSchema.statics.createToken = async function(userId, userType) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7); // 7 days expiry

  // Generate secure random token using crypto
  const token = crypto.randomBytes(40).toString('hex');

  const refreshToken = await this.create({
    token: token,
    userId: userId,
    userType: userType,
    expiresAt: expiryDate
  });

  return refreshToken.token;
};

// Static method to verify token
RefreshTokenSchema.statics.verifyExpiration = function(token) {
  return token.expiresAt.getTime() < new Date().getTime();
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
