const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review');

router.get('/', reviewController.getReviewQueue);
router.get('/count', reviewController.getReviewCount);
router.post('/submit', reviewController.submitReview);

module.exports = router;
