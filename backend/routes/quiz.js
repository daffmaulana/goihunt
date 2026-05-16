const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quiz');

router.get('/:vocabId', quizController.getQuiz);
router.post('/submit', quizController.submitQuiz);

module.exports = router;