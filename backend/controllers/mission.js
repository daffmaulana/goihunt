// /api/mission
// CUMA BUAT NARIK MISI HARIAN. INI SEPERTI PERANTARA ANTARA FE <-> MISI APA HARI INI? <-> UTILS MILIH MISI <-> DB
// LOGIC PEMILIHAN MISSIONNYA ADA DI FOLDER UTILS, BISA DITAMBAH MISI APA SAJA SEPUASNYA DI SANA.


const { getTodayMission } = require('../utils/mission');
const pool = require('../db');


const getMission = async (req, res) => {
  try {

    const today = new Date().toISOString().slice(0, 10);

    const userId = req.user.userId;

    const mission = await getTodayMission();

    const result = await pool.query(
       `
        SELECT id
        FROM user_missions
        WHERE user_id = $1
        AND mission_date = $2
        LIMIT 1
        `,
        [userId, today]
      );

    const isCompleted = result.rows.length > 0;

    res.json({
      ...mission,
      is_completed: isCompleted
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Gagal ambil misi'
    });
  }
};

module.exports = { getMission };