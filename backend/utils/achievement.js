// UTILS BUAT NGECEKLIS ACHIEVEMENT JIKA TOTAL DI TABLE USERS SUDAH MELEBIHI TARGET YANG DITENTUKAN.
// CONTOHNYA DI CONTROLLER AUTH UNTUK CEKLIS ACHIEVEMENT LOGIN.

const pool = require('../db');

const ACTIVITY_COUNTERS = {
  CLASSIFY: 'total_classify',
  QUIZ: 'total_quiz',
  MISSION: 'total_mission',
  VOCAB: 'total_vocab'
};

const checkAchievements = async (userId, type) => {
  const userRes = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  const user = userRes.rows[0];

  const achievements = await pool.query(
    'SELECT * FROM achievements WHERE type = $1',
    [type]
  );

  for (let a of achievements.rows) {
    let progress = 0;

    if (type === 'CLASSIFY') progress = user.total_classify;
    if (type === 'QUIZ') progress = user.total_quiz;
    if (type === 'MISSION') progress = user.total_mission;
    if (type === 'VOCAB') progress = user.total_vocab;
    if (type === 'LOGIN') progress = 1;

    if (progress >= a.target) {
      const existing = await pool.query(
        'SELECT id FROM user_achievements WHERE user_id = $1 AND achievement_id = $2',
        [userId, a.id]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
          [userId, a.id]
        );
      }
    }
  }
};

const incrementAchievementProgress = async (userId, type, amount = 1) => {
  const column = ACTIVITY_COUNTERS[type];

  if (column) {
    await pool.query(
      `UPDATE users SET ${column} = ${column} + $1 WHERE id = $2`,
      [amount, userId]
    );
  }

  await checkAchievements(userId, type);
};

const syncVocabProgress = async (userId) => {
  const result = await pool.query(
    'SELECT COUNT(*) AS total FROM user_collections WHERE user_id = $1',
    [userId]
  );

  const total = parseInt(result.rows[0].total, 10);

  await pool.query(
    'UPDATE users SET total_vocab = $1 WHERE id = $2',
    [total, userId]
  );
};

module.exports = { checkAchievements, incrementAchievementProgress, syncVocabProgress };