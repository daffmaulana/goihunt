// /api/collection
// HANDLE NAMBAHIN/NGURANGIN KOLEKSI USER SAAT SETELAH BERHASIL KLASIFIKASI DAN DI HALAMAN KOLEKSI DETAIL (📝 ON GOING) DAN NGAMBIL DAFTAR KOLEKSI BUAT DITAMPILIN DI HALAMAN KOLEKSI

const pool = require('../db');
const { incrementAchievementProgress, syncVocabProgress } = require('../utils/achievement');

exports.addCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vocabId } = req.body;

    const result = await pool.query(
      `INSERT INTO user_collections (user_id, vocab_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, vocab_id) DO NOTHING
       RETURNING *`,
      [userId, vocabId]
    );

    if (result.rows.length > 0) {
      await incrementAchievementProgress(userId, 'VOCAB');
    }

    res.json({
      code: 'COLLECTION_ADDED',
      message: 'Berhasil ditambahkan ke koleksi'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal menyimpan koleksi'
    });
  }
};

exports.getCollection = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(`
      SELECT v.*
      FROM user_collections uv
      JOIN vocab v ON uv.vocab_id = v.id
      WHERE uv.user_id = $1
      ORDER BY uv.created_at DESC
    `, [userId]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal ambil koleksi'
    });
  }
};

exports.removeCollection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vocabId } = req.params;

    const result = await pool.query(
      `DELETE FROM user_collections
       WHERE user_id = $1 AND vocab_id = $2`,
      [userId, vocabId]
    );

    if (result.rowCount > 0) {
      await syncVocabProgress(userId);
    }

    res.json({
      code: 'COLLECTION_REMOVED',
      message: 'Berhasil dihapus dari koleksi'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal menghapus koleksi'
    });
  }
};