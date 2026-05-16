const express = require('express');
const router = express.Router();
const classifyController = require('../controllers/classify.js');

router.get('/:label', classifyController.getClassify);

module.exports = router;