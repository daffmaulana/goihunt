// /api/auth
// UNTUK NGATUR LOGIC AUTENTIKASI. MULAI DARI LOGIN, REGISTER, ACCESS TOKEN (JWT), REFRESH TOKEN (EXPIRED-IN JWT), FORGOT PASSWORD (SEND RESET EMAIL), DAN RESET PASSWORD (UBAH PASSWORD DARI RESET EMAIL).

const bcrypt = require('bcrypt');
const pool = require('../db');
const { generateAccessToken, generateResetToken, generateRefreshToken, hashToken } = require('../utils/token');
const { sendResetPasswordEmail } = require('../utils/mailer');
const { checkAchievements } = require('../utils/achievement');

const usernameRegex = /^[a-z0-9_]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;

// Register, Login, Refresh, Logout, Forgot password, Reset Password

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

    const avatar_key = AVATARS[Math.floor(Math.random() * AVATARS.length)];

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password, avatar_key)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar_key`,
      [username, email, hashedPassword, avatar_key]
    );

    res.status(201).json(newUser.rows[0]);

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
    const refreshToken = generateRefreshToken();
    const hashedRefreshToken = hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 hari

    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, hashedRefreshToken, expiresAt]
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // true kalau HTTPS / false
      sameSite: 'none', // none kalau https, strict kalau local
      maxAge: 1 * 24 * 60 * 60 * 1000 // 1 hari
    });

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

exports.refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ code:'INVALID_TOKEN', message: 'Refresh token missing' });
    }

    const hashedToken = hashToken(refreshToken);

    const tokenQuery = await pool.query(
      `SELECT rt.*, u.id, u.email
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token = $1 AND rt.expires_at > NOW()`,
      [hashedToken]
    );

    if (tokenQuery.rows.length === 0) {
      return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Invalid refresh token' });
    }

    const user = tokenQuery.rows[0];

    const newAccessToken = generateAccessToken(user);

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      const hashedToken = hashToken(refreshToken);

      await pool.query(
        'DELETE FROM refresh_tokens WHERE token = $1',
        [hashedToken]
      );
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'none',
      secure: true // true jika HTTPS
    });

    res.json({ code:'LOGGED_OUT', message: 'Logged out successfully' });

    // Then, di frontend akan menghapus AccessToken.

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.json({ code:'RESET_PASSWORD_SENT', message: 'Jika email terdaftar, link reset akan dikirim' });
    }

    email = email.toLowerCase().trim();

    if (!emailRegex.test(email)) {
      return res.status(400).json({  code:'INVALID_EMAIL',  message: 'Format email tidak valid' });
    }

    const userQuery = await pool.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    );

    if (userQuery.rows.length === 0) {
      return res.json({ code:'RESET_PASSWORD_SENT', message: 'Jika email terdaftar, link reset akan dikirim' });
    }

    const user = userQuery.rows[0];

    const userId = user.id;
    const username = user.username;

    await pool.query(
      'DELETE FROM password_resets WHERE user_id = $1',
      [userId]
    );

    const resetToken = generateResetToken();
    const hashedToken = hashToken(resetToken);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 menit

    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hashedToken, expiresAt]
    );

    await sendResetPasswordEmail(email, username, resetToken);

    return res.json({ code:'RESET_PASSWORD_SENT', message: 'Jika email terdaftar, link reset akan dikirim' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ code: 'FIELD_MISSING', message: 'Data tidak lengkap' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ code: 'PASSWORD_MISMATCH', message: 'Konfirmasi password tidak cocok'});
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Password minimal 8 karakter' });
    }

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ code: 'WEAK_PASSWORD', message: 'Password harus mengandung huruf dan angka' });
    }

    const hashedToken = hashToken(token);

    const resetQuery = await pool.query(
      `SELECT pr.user_id
       FROM password_resets pr
       WHERE pr.token = $1 AND pr.expires_at > NOW()`,
      [hashedToken]
    );

    if (resetQuery.rows.length === 0) {
      return res.status(400).json({ code: 'INVALID_TOKEN', message: 'Token reset tidak valid atau sudah expired' });
    }

    const userId = resetQuery.rows[0].user_id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    await pool.query(
      'DELETE FROM password_resets WHERE user_id = $1',
      [userId]
    );

    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );

    res.json({ code:'PASSWORD_UPDATED', message: 'Password diubah dan silahkan login ulang' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};