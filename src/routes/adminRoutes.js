const express = require('express');
const router = express.Router();
const { adminLogin, getMe } = require('../controllers/authController');
const { getStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.post('/login', adminLogin);
router.get('/me', protect, getMe);
router.get('/stats', protect, getStats);

module.exports = router;
