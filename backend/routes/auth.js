const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.js');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000 * 999,
  max: 999,
  message: {
    message: 'Terlalu banyak percobaan login'
  }
});

const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000 * 999,
  max: 999,
  message: {
    message: 'Terlalu banyak pendaftaran'
  }
});

const forgotLimiter = rateLimit({
  windowMs: 5 * 60 * 1000 * 999,
  max: 999,
  message: {
    message: 'Terlalu banyak permintaan reset password'
  }
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);   

module.exports = router;