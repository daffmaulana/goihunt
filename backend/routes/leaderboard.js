const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboard');

router.get('/', leaderboardController.getLeaderboard);
router.get('/top3', leaderboardController.getLeaderboardTop3);

module.exports = router;