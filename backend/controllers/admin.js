const pool = require('../db');

function pgMessage(err) {
  if (err.detail) return err.detail;
  if (err.message) return err.message;
  return 'Terjadi kesalahan pada server';
}

exports.getQuiz = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quiz ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.createQuiz = async (req, res) => {
  try {
    const { vocab_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    const result = await pool.query(
      `INSERT INTO quiz (vocab_id, question, option_a, option_b, option_c, option_d, correct_answer)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vocab_id, question, option_a, option_b, option_c, option_d, correct_answer]
    );

    res.status(201).json({
      message: 'Entri kuis dibuat',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { vocab_id, question, option_a, option_b, option_c, option_d, correct_answer } = req.body;

    const result = await pool.query(
      `UPDATE quiz
       SET vocab_id=$1, question=$2, option_a=$3, option_b=$4, option_c=$5, option_d=$6, correct_answer=$7
       WHERE id=$8
       RETURNING *`,
      [vocab_id, question, option_a, option_b, option_c, option_d, correct_answer, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Entri kuis tidak ditemukan` });
    }

    res.json({
      message: 'Entri kuis terupdate',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM user_quiz WHERE quiz_id = $1', [id]);

    const result = await pool.query(
      'DELETE FROM quiz WHERE id=$1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Entri kuis tidak ditemukan` });
    }

    res.json({
      message: 'Entri kuis dihapus',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.getVocab = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vocab ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.updateVocab = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, image_url, kanji, furigana, romaji, definition, example_id, example_romaji, example_furigana } = req.body;

    const result = await pool.query(
      `UPDATE vocab
       SET label=$1, image_url=$2, kanji=$3, furigana=$4, romaji=$5, definition=$6, example_id=$7, example_romaji=$8, example_furigana=$9
       WHERE id=$10
       RETURNING *`,
      [label, image_url, kanji, furigana, romaji, definition, example_id, example_romaji, example_furigana, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Entri vocab tidak ditemukan` });
    }

    res.json({
      message: 'Entri vocab terupdate',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.getAchievements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM achievements ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.updateAchievement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, deskripsi } = req.body;

    const result = await pool.query(
      `UPDATE achievements
       SET name=$1, deskripsi=$2
       WHERE id=$3
       RETURNING *`,
      [name, deskripsi, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Entri achievement tidak ditemukan` });
    }

    res.json({
      message: 'Entri achievement terupdate',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, password, created_at, avatar_key,
              xp, level, total_classify, total_quiz, total_mission, total_vocab, xp_timestamp
       FROM users ORDER BY id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM user_quiz         WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM user_missions     WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM user_achievements WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM user_classify     WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM password_resets   WHERE user_id = $1', [id]);

    const result = await pool.query(
      'DELETE FROM users WHERE id=$1 RETURNING id, username, email',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: `Entri user tidak ditemukan` });
    }

    res.json({
      message: 'Entri user dihapus',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};

// ── DEV ONLY: Mundurkan next_review_at untuk testing SR ──────────────────────
// POST /admin/sr-time-travel
// Body: { userId, days }  → mundurkan next_review_at semua koleksi user sebesar `days` hari
// Contoh: { userId: 1, days: 1 } → seolah-olah sudah 1 hari berlalu
exports.srTimeTravel = async (req, res) => {
  try {
    const { userId, days } = req.body;

    if (!userId || !days || days < 1) {
      return res.status(400).json({ message: 'userId dan days (min 1) wajib diisi' });
    }

    const result = await pool.query(
      `UPDATE user_collections
       SET next_review_at = next_review_at - ($1 * INTERVAL '1 day')
       WHERE user_id = $2
       RETURNING vocab_id, next_review_at`,
      [days, userId]
    );

    res.json({
      message: `next_review_at dimundurkan ${days} hari untuk ${result.rowCount} vocab milik user ${userId}`,
      updated: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: pgMessage(err) });
  }
};