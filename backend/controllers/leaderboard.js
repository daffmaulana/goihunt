// /api/leaderboard
// UNTUK NGAMBIL DAFTAR LEADERBOARD (USER DENGAN XP TERTINGGI) UNTUK DITAMPILIN DI PAGE LEADERBOARD

const pool = require('../db');

exports.getLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, avatar_key, xp, level
      FROM users
      ORDER BY xp DESC, xp_timestamp ASC
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal mengambil leaderboard'
    });
  }
};

exports.getLeaderboardTop3 = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, avatar_key, xp, level
      FROM users 
      ORDER BY xp DESC, xp_timestamp ASC LIMIT 3
    `);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal mengambil top 3 leaderboard'
    });
  }
};