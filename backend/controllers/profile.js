// /api/profile
// UNTUK NGATUR PROFILE USER, MULAI DARI NARIK DATA PROFILE, UPDATE PROFILE (USERNAME DAN AVATAR), DAN UPDATE PASSWORD. UNTUK UPDATE PASSWORD, KALAU BERHASIL, USER LANGSUNG DI-LOGOUT DAN DISURUH LOGIN ULANG DENGAN PASSWORD BARU.

const pool = require('../db');
const bcrypt = require('bcrypt');
const Levels = require('../config/levelConfig');

exports.getProfile = async (req, res) => {
  
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, username, email, avatar_key, xp, level FROM users WHERE id = $1',
      [userId]
    );

    const user=result.rows[0];
    const currentLevelData = Levels.find(l => l.level === user.level);

    // Cari next level
    const nextLevelData = Levels.find(l => l.level === user.level + 1);

    const currentRequiredXp = currentLevelData?.requiredXp || 0;

    const nextRequiredXp = nextLevelData?.requiredXp || currentRequiredXp;

    // XP dalam level sekarang
    const xpCurrent = user.xp - currentRequiredXp;

    // Total XP yang dibutuhkan untuk naik level
    const xpNeeded = nextRequiredXp - currentRequiredXp;

    // Progress %
    const progress =  xpNeeded > 0 ? (xpCurrent / xpNeeded) * 100 : 100;

    res.json({
      ...user,
      xp_current: xpCurrent,
      xp_next: xpNeeded,
      progress: Math.min(progress, 100)
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      code:'SERVER_ERROR',
      message: 'Terjadi kesalahan pada server, coba lagi'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { username, profileImage } = req.body;

    if (!username && !profileImage) {
      return res.status(400).json({ code:'FIELD_MISSING', message: 'Tidak ada data untuk diupdate' });
    }

    if (username) {
      username = username.toLowerCase().trim();

      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ code:'INVALID_USERNAME', message: 'Username 3-20 karakter, hanya huruf kecil, angka, atau underscore' });
      }

      const existing = await pool.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, userId]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({ code:'USERNAME_EXISTS', message: 'Username sudah digunakan' });
      }
    }

    await pool.query(
      `UPDATE users
       SET username = COALESCE($1, username),
           avatar_key = COALESCE($2, avatar_key)
       WHERE id = $3`,
      [username, profileImage ? `/avatars/${profileImage}.svg` : null, userId]
    );

    res.json({ code:'PROFILE_UPDATED', message: 'Profil diperbarui' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ code:'FIELD_MISSING', message: 'Semua field wajib diisi' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ code:'PASSWORD_MISMATCH', message: 'Konfirmasi password tidak cocok' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ code:'WEAK_PASSWORD', message: 'Password minimal 8 karakter' });
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).+$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ code:'WEAK_PASSWORD', message: 'Password harus mengandung huruf dan angka' });
    }

    const userQuery = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    const isMatch = await bcrypt.compare(
      currentPassword,
      userQuery.rows[0].password
    );

    if (!isMatch) {
      return res.status(400).json({ code:'INVALID_OLD_PASSWORD', message: 'Password lama salah' });
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      userQuery.rows[0].password
    );

    if (isSamePassword) {
    return res.status(400).json({ code:'SAME_PASSWORD', message: 'Password baru tidak boleh sama dengan password lama' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashed, userId]
    );

    res.json({ code:'PASSWORD_UPDATED', message: 'Password berhasil diubah dan silahkan login ulang' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ code:'SERVER_ERROR', message: 'Terjadi kesalahan pada server, coba lagi' });
  } 
};