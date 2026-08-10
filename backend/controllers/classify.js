const pool = require('../db');
const { incrementAchievementProgress } = require('../utils/achievement');
const { completeMissionIfTarget } = require('../utils/mission');
const { addXpToUser } = require('../utils/xp');

exports.getClassify = async (req, res) => {
  try {
    const { label } = req.params;
    const { classify } = req.query;
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT v.*, 
        CASE WHEN uc.vocab_id IS NOT NULL THEN true ELSE false END as collected
       FROM vocab v
       LEFT JOIN user_collections uc 
         ON uc.vocab_id = v.id AND uc.user_id = $2
       WHERE v.label = $1`,
      [label, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        code: 'VOCAB_NOT_FOUND'
      });
    }

    const vocab = result.rows[0];
    let xpChange = 0;
    let missionXpChange = 0;
    let missionCompleted = false;

    if (classify === 'true') {

      let achievementCompleted = false;
      const today = new Date().toISOString().slice(0, 10);

      // cek udah klasifikasi hari ini?
      const alreadyClassified = await pool.query(
        'SELECT id FROM user_classify WHERE user_id = $1 AND vocab_id = $2 AND date = $3',
        [userId, vocab.id, today]
      );

      // jika belum, maka dapat XP + progress achievement + catet hari ini udah classify objek ini biar ga spam
      if (alreadyClassified.rows.length === 0) {
        const xpResult = await addXpToUser(userId, 'CLASSIFY');
        xpChange = xpResult.gained;

        await incrementAchievementProgress(userId, 'CLASSIFY');       

        await pool.query(
          'INSERT INTO user_classify (user_id, vocab_id, date) VALUES ($1, $2, $3)',
          [userId, vocab.id, today]
        );
      }
      missionCompleted = await completeMissionIfTarget(userId, vocab.label); // cek apakah mission berhasil?
      if (missionCompleted) { // jika ya, maka tambahkan progress achievement
        const missionXp = await addXpToUser(userId, 'MISSION');
        missionXpChange = missionXp.gained;
        await incrementAchievementProgress(userId, 'MISSION');
      }
    }

    res.json({ ...vocab, xpChange, missionCompleted, missionXpChange });

  } catch (err) {
    res.status(500).json({
      code: 'SERVER_ERROR'
    });
  }
};