// /api/achievements
// AMBIL SEMUA ACHIEVEMENT DAN STATUS UNLOCKNYA (UNLOCK ATAU BELUM) UNTUK USER YANG SEDANG LOGIN
// DIPAKAI DI PAGE GAMIFIKASI UNTUK SECTION ACHIEVEMENT

const pool = require('../db');
const achievement = require('../utils/achievement');

exports.getAchievements = async (req, res) => {
try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        a.id, a.code, a.icon, a.name, a.deskripsi, 
        ua.unlocked_at 
      FROM achievements a
      LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
      ORDER BY a.id ASC
    `;

    const { rows } = await pool.query(query, [userId]);

    const result = rows.map(a => ({
      code: a.code,
      icon: a.icon,
      name: a.name,
      deskripsi: a.deskripsi,
      unlocked: !!a.unlocked_at, 
      unlocked_at: a.unlocked_at 
    }));

    result.sort((a, b) => {
      if (a.unlocked === b.unlocked) {
        if (a.unlocked) {
          return new Date(a.unlocked_at) - new Date(b.unlocked_at); 
        }
        return 0; 
      }
      return a.unlocked ? -1 : 1; 
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal ambil achievement'
    });
  }
};