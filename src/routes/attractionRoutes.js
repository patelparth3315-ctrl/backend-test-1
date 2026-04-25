const express = require('express');
const router = express.Router();
const attractionController = require('../controllers/attractionController');

router.get('/', attractionController.getAttractions);
router.post('/', attractionController.createAttraction);
router.put('/:id', attractionController.updateAttraction);
router.delete('/:id', attractionController.deleteAttraction);

module.exports = router;
