const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getDraftSettings } = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const requireRole = require('../middleware/role');

router.get('/', getSettings);
router.put('/', protect, requireRole('admin'), updateSettings);
router.get('/draft', protect, requireRole('admin'), getDraftSettings);

module.exports = router;
