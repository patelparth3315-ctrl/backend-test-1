const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBooking,
  updateBookingStatus,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, protectUser } = require('../middleware/auth');

// Protected route (authenticated users only)
router.post('/', protectUser, createBooking);

// Admin routes
router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id', protect, updateBooking);
router.patch('/:id/status', protect, updateBookingStatus);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
