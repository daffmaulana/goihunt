const pool = require('../db');

const getTodayMission = async () => {
  const today = new Date().toISOString().slice(0, 10);

  const existing = await pool.query(
    'SELECT * FROM daily_missions WHERE date = $1',
    [today]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const itemsResult = await pool.query('SELECT label FROM vocab');
  const ITEMS = itemsResult.rows.map(row => row.label);

  const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];

  const result = await pool.query(
    'INSERT INTO daily_missions (date, target_item) VALUES ($1, $2) RETURNING *',
    [today, randomItem]
  );

  return result.rows[0];
};

const completeMissionIfTarget = async (userId, label) => {
  const mission = await getTodayMission();
  if (!mission || mission.target_item !== label) return false;

  const today = new Date().toISOString().slice(0, 10);
  const missionDone = await pool.query(
    'SELECT id FROM user_missions WHERE user_id = $1 AND mission_date = $2',
    [userId, today]
  );

  if (missionDone.rows.length > 0) {
    return false;
  }

  await pool.query(
    'INSERT INTO user_missions (user_id, mission_date) VALUES ($1, $2)',
    [userId, today]
  );

  return true;
};

module.exports = { getTodayMission, completeMissionIfTarget };