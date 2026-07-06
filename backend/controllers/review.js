// CONTROLLER SPACED REPETITION
// GET  /review         → ambil vocab dari koleksi user yang next_review_at <= hari ini
// POST /review/submit  → terima hasil jawaban, hitung jadwal review berikutnya (SM-2)

const pool = require('../db');
const { addXpToUser } = require('../utils/xp');
const { incrementAchievementProgress } = require('../utils/achievement');
const xpRules = require('../config/xpRules');

// ── Algoritma SM-2 yang disederhanakan ───────────────────────────────────────
// quality : 1 = salah, 5 = benar mudah (kita pakai 2 level: benar=5, salah=1)
// ease_factor minimal 1.3 agar tidak terlalu cepat turun
function sm2(repetition, interval, easeFactor, quality) {
  let newRepetition = repetition;
  let newInterval = interval;
  let newEaseFactor = easeFactor;

  if (quality >= 3) {
    // Jawab benar
    if (newRepetition === 0) {
      newInterval = 3;
    } else if (newRepetition === 1) {
      newInterval = 5;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetition += 1;
  } else {
    // Jawab salah — reset
    newRepetition = 0;
    newInterval = 3;
  }

  // Update ease factor berdasarkan kualitas jawaban
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  return {
    repetition: newRepetition,
    interval: newInterval,
    easeFactor: parseFloat(newEaseFactor.toFixed(4))
  };
}

// GET /review
// Mengembalikan daftar vocab dari koleksi user yang sudah waktunya direview (next_review_at <= today)
exports.getReviewQueue = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT
         uc.vocab_id,
         uc.sr_interval,
         uc.sr_ease_factor,
         uc.sr_repetition,
         uc.next_review_at,
         v.id,
         v.label,
         v.image_url,
         v.kanji,
         v.furigana,
         v.romaji,
         v.definition,
         v.example_id,
         v.example_romaji,
         v.example_furigana
       FROM user_collections uc
       JOIN vocab v ON uc.vocab_id = v.id
       WHERE uc.user_id = $1
         AND uc.next_review_at <= $2
       ORDER BY uc.next_review_at ASC`,
      [userId, today]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal mengambil antrean review'
    });
  }
};

// GET /review/count
// Mengembalikan jumlah vocab yang perlu direview hari ini (untuk badge di navbar)
exports.getReviewCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM user_collections
       WHERE user_id = $1
         AND next_review_at <= $2`,
      [userId, today]
    );

    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal mengambil jumlah review'
    });
  }
};

// POST /review/submit
// Body: { vocabId, quizId, answer }
// Mengevaluasi jawaban, memperbarui jadwal SR, dan memberikan XP
exports.submitReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { vocabId, quizId, answer } = req.body;

    if (!vocabId || !quizId || !answer) {
      return res.status(400).json({
        code: 'INVALID_BODY',
        message: 'vocabId, quizId, dan answer wajib diisi'
      });
    }

    // Ambil jawaban benar dari tabel quiz
    const quizRes = await pool.query(
      'SELECT correct_answer FROM quiz WHERE id = $1',
      [quizId]
    );

    if (quizRes.rows.length === 0) {
      return res.status(404).json({ code: 'QUIZ_NOT_FOUND', message: 'Soal tidak ditemukan' });
    }

    const isCorrect = quizRes.rows[0].correct_answer === answer;
    const quality = isCorrect ? 5 : 1;

    // Ambil state SR saat ini dari user_collections
    const srRes = await pool.query(
      `SELECT sr_interval, sr_ease_factor, sr_repetition
       FROM user_collections
       WHERE user_id = $1 AND vocab_id = $2`,
      [userId, vocabId]
    );

    if (srRes.rows.length === 0) {
      return res.status(404).json({
        code: 'COLLECTION_NOT_FOUND',
        message: 'Vocab tidak ada di koleksi user'
      });
    }

    const { sr_interval, sr_ease_factor, sr_repetition } = srRes.rows[0];

    // Hitung jadwal baru dengan SM-2
    const { repetition, interval, easeFactor } = sm2(
      sr_repetition,
      sr_interval,
      parseFloat(sr_ease_factor),
      quality
    );

    const today = new Date();
    const nextReview = new Date(today);
    nextReview.setDate(today.getDate() + interval);
    const nextReviewDate = nextReview.toISOString().split('T')[0];

    // Simpan state SR yang baru
    await pool.query(
      `UPDATE user_collections
       SET sr_repetition  = $1,
           sr_interval    = $2,
           sr_ease_factor = $3,
           next_review_at = $4
       WHERE user_id = $5 AND vocab_id = $6`,
      [repetition, interval, easeFactor, nextReviewDate, userId, vocabId]
    );

    // Berikan XP dan increment achievement QUIZ
    let xpChange = 0;
    if (isCorrect) {
      xpChange = xpRules.SR_CORRECT;
      await addXpToUser(userId, 'SR_CORRECT');
      await incrementAchievementProgress(userId, 'QUIZ');
    } else {
      xpChange = xpRules.SR_INCORRECT;
      await addXpToUser(userId, 'SR_INCORRECT');
    }

    res.json({
      correct: isCorrect,
      xpChange,
      nextReviewAt: nextReviewDate,
      newInterval: interval
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal submit review'
    });
  }
};
