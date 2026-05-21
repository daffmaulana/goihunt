// generate kebutuhan token JWT
// accessToken = JWT token, refreshToken = renewal JWT, resetToken = reset pass token, hashToken = ya buat kasih hash token wkwk biar aman disimpen di DB

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateAccessToken = (user) => {
  return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '999m' }
  );
};

exports.generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};