// generate kebutuhan token JWT
// accessToken = JWT token, resetToken = reset pass token, hashToken = hash token untuk keamanan disimpan di DB

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateAccessToken = (user) => {return jwt.sign(
    { userId: user.id, email: user.email, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '60m' }
  );};

exports.generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

exports.generateAdminToken = () => {return jwt.sign(
  { role: 'admin' },  
  process.env.JWT_SECRET,
  { expiresIn: '60m' }
  );};