const pool = require('../db');
const xpRules = require('../config/xpRules');
const LEVELS = require('../config/levelConfig');

function upLevel(xp) {
  let currentLevel = 1;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].requiredXp) {
      currentLevel = LEVELS[i].level;
    } else {
      break;
    }
  }
  return currentLevel;
}

const addXpToUser = async (userId, type, customAmount = null) => {
  const xpAmount = customAmount ?? xpRules[type];

  if (xpAmount == null) {
    throw new Error('INVALID_ACTIVITY');
  }

  const userRes = await pool.query(
    'SELECT xp FROM users WHERE id = $1',
    [userId]
  );

  const currentXp = userRes.rows[0].xp;
  const newXp = Math.max(currentXp + xpAmount, 0);
  const newLevel = upLevel(newXp);

  await pool.query(
    'UPDATE users SET xp = $1, level = $2 WHERE id = $3',
    [newXp, newLevel, userId]
  );

  return {
    xp: newXp,
    level: newLevel,
    gained: xpAmount
  };
};

module.exports = { addXpToUser, upLevel };
