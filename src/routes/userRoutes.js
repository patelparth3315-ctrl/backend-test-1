const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, updateUserRole } = require('../controllers/userController');
const { getMyBookings } = require('../controllers/bookingController');
const { protectUser, protect } = require('../middleware/auth');
const authorize = require('../middleware/role');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectUser, getMe);
router.get('/bookings', protectUser, getMyBookings);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.patch('/:id/role', protect, authorize('admin'), updateUserRole);

module.exports = router;
