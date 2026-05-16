const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievement');

router.get('/', achievementController.getAchievements);

module.exports = router;