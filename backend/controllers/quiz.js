const pool = require('../db');
const { addXpToUser } = require('../utils/xp');
const { incrementAchievementProgress } = require('../utils/achievement');
const xpRules = require('../config/xpRules');

exports.getQuiz = async (req, res) => {
  const { vocabId } = req.params;

  const result = await pool.query(
    `SELECT * FROM quiz
     WHERE vocab_id = $1 
     ORDER BY RANDOM() 
     LIMIT 1`,
    [vocabId]
  );

  res.json(result.rows[0] || null);
};

exports.submitQuiz = async (req, res) => {
  const { quizId, answer, vocabId } = req.body;
  const userId = req.user.userId;

  const quiz = await pool.query(
    'SELECT correct_answer FROM quiz WHERE id = $1',
    [quizId]
  );

  const isCorrect = quiz.rows[0].correct_answer === answer;

  const progress = await pool.query(
    'SELECT * FROM user_quiz WHERE user_id = $1 AND quiz_id = $2',
    [userId, quizId]
  );

  const alreadyCorrect = progress.rows.length > 0;

  let xpChange = 0;


// jika belum pernah benar, berlakukan +XP jika benar dan -XP jika salah, dan +progress
// jika sudah pernah benar, jika benar atau salah tidak ada perubahan XP, tapi jika benar tetap +progress

if (isCorrect) {
  await incrementAchievementProgress(userId, 'QUIZ');
}

if (!alreadyCorrect) {
  if (isCorrect) {
    xpChange = xpRules.QUIZ_CORRECT;
    await addXpToUser(userId, 'QUIZ_CORRECT');

    await pool.query(
      'INSERT INTO user_quiz (user_id, vocab_id, quiz_id) VALUES ($1, $2, $3)',
      [userId, vocabId, quizId]
    );

    // Tandai vocab sebagai "dikuasai" di koleksi jika ada
    // (tidak peduli soal yang mana, cukup pernah jawab benar vocab ini)
    await pool.query(
      `UPDATE user_collections SET mastered_at = NOW()
       WHERE user_id = $1 AND vocab_id = $2 AND mastered_at IS NULL`,
      [userId, vocabId]
    );

  } else {
    xpChange = xpRules.QUIZ_INCORRECT;
    await addXpToUser(userId, 'QUIZ_INCORRECT');
  }
} else {
  xpChange = 0;
}

  res.json({
    correct: isCorrect,
    xpChange: xpChange,
    alreadyMastered: alreadyCorrect
  });
};