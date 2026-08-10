// /api/auth
// UNTUK NGATUR LOGIC AUTENTIKASI. MULAI DARI LOGIN, REGISTER, ACCESS TOKEN (JWT), FORGOT PASSWORD (RESET LANGSUNG KE PASS ACAK).
require('dotenv').config();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../db');
const { generateAccessToken, generateAdminToken } = require('../utils/token');
const { checkAchievements } = require('../utils/achievement');

const usernameRegex = /^[a-z0-9_]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

// Register, Login, Logout, Forgot password, Reset Password

exports.register = async (req, res) => {
  try {
    let { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ code:'FIELD_MISSING', message: 'Semua field wajib diisi' });
    }

    username = username.toLowerCase().trim();
    email = email.toLowerCase().trim();

    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        code: 'INVALID_USERNAME', message: 'Username 3-20 karakter, hanya huruf kecil, angka, atau underscore' });
    }

    // validasi format email
    if (!emailRegex.test(email)) {
      return res.status(400).json({  code:'INVALID_EMAIL', message: 'Format email tidak valid' });
    }

    // validasi kecocokan password
    if (password !== confirmPassword) {
      return res.status(400).json({  code:'PASSWORD_MISMATCH', message: 'Konfirmasi password tidak cocok' });
    }

    // validasi kekuatan password. min 8 karakter kombinasi
    if (password.length < 8) {
      return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Password minimal 8 karakter' });
    }
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Password harus mengandung huruf dan angka' });
    }

    // validasi email unik
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ code: 'USER_EXISTS', message: 'Email atau username sudah digunakan' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const AVATARS = ['bear', 'cat', 'cow', 'dog', 'panda', 'rabbit', 'tiger', 'whale','worm','penguin'];

    const avatar_key = `/avatars/${AVATARS[Math.floor(Math.random() * AVATARS.length)]}.svg`;

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, avatar_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar_key`,
      [username, email, hashedPassword, avatar_key]
    );

    const user = newUser.rows[0];
    const accessToken = generateAccessToken(user);

    res.status(201).json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

    await checkAchievements(user.id, 'LOGIN');

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.login = async (req, res) => {
  try {
    let { identifier, password } = req.body;
    identifier = (identifier || '').toString().toLowerCase().trim();

    if (!identifier || !password) {
      return res.status(400).json({ code:'FIELD_MISSING', message: 'Email/username dan password wajib diisi' });
    }

    let queryText;

    if (identifier.includes('@')) { 
      if (!emailRegex.test(identifier)) {
        return res.status(400).json({ code:'INVALID_EMAIL', message: 'Format email tidak valid' });
      }
      queryText = 'SELECT id, email, username, password FROM users WHERE email = $1';
    } else {
      if (!usernameRegex.test(identifier)) {
        return res.status(400).json({ code:'INVALID_USERNAME', message: 'Username tidak valid' });
      }
      queryText = 'SELECT id, email, username, password FROM users WHERE username = $1';
    }

    const userQuery = await pool.query(queryText, [identifier]);

    if (userQuery.rows.length === 0) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email/username atau password salah' });
    }

    const user = userQuery.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Email/username atau password salah' });
    }

    const accessToken = generateAccessToken(user);

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

    await checkAchievements(user.id, 'LOGIN');

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};


exports.logout = async (req, res) => {
  try {
    res.json({ code:'LOGGED_OUT', message: 'Logged out successfully' });

    // Frontend akan menghapus AccessToken dari localStorage.

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ code: 'FIELD_MISSING', message: 'Email wajib diisi' });
    }

    email = email.toLowerCase().trim();

    if (!emailRegex.test(email)) {
      return res.status(400).json({ code: 'INVALID_EMAIL', message: 'Format email tidak valid' });
    }

    const userQuery = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.json({ code: 'RESET_DONE', message: 'Jika email terdaftar, password telah direset' });
    }

    const userId = userQuery.rows[0].id;

    // Generate password acak 8 karakter (huruf + angka)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz0123456789';
    let newPassword = '';
    const randomBytes = crypto.randomBytes(8);
    for (let i = 0; i < 8; i++) {
      newPassword += chars[randomBytes[i] % chars.length];
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    return res.json({
      code: 'RESET_DONE',
      message: 'Password berhasil direset',
      newPassword
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (
      identifier === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const adminToken = generateAdminToken();
      return res.json({ adminToken });
    }

    return res.status(401).json({message:'Username/Password Admin Salah'});

  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};
