const express = require('express');
const router = express.Router();
const collectionController = require('../controllers/collection');

router.post('/', collectionController.addCollection);
router.get('/', collectionController.getCollection);
router.delete('/:vocabId', collectionController.removeCollection);

module.exports = router;