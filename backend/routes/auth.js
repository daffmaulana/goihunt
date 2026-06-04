const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.js');
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    message: 'Terlalu banyak percobaan login, coba lagi dalam 1 menit'
  }
});

const registerLimiter = rateLimit({
  windowMs: 5* 60 * 1000, //5 menit
  max: 5,
  message: {
    message: 'Terlalu banyak percobaan pendaftaran, coba lagi dalam 5 menit'
  }
});

const forgotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, //10 menit
  max: 3,
  message: {
    message: 'Terlalu banyak permintaan reset password, coba lagi dalam 10 menit'
  }
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);   

module.exports = router;