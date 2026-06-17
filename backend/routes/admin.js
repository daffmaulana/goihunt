const express = require('express');
const router = express.Router();
const {
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getVocab,
  updateVocab,
  getAchievements,
  updateAchievement,
  getUsers,
  deleteUser,
} = require('../controllers/admin');

router.get('/quiz', getQuiz);
router.post('/quiz', createQuiz);
router.put('/quiz/:id', updateQuiz);
router.delete('/quiz/:id', deleteQuiz);

router.get('/vocab', getVocab);
router.put('/vocab/:id', updateVocab);

router.get('/achievements', getAchievements);
router.put('/achievements/:id', updateAchievement);

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

module.exports = router;
