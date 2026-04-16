const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/userController');
const { getMyBookings } = require('../controllers/bookingController');
const { protectUser } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectUser, getMe);
router.get('/bookings', protectUser, getMyBookings);

module.exports = router;
