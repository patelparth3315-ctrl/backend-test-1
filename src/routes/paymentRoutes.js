const express = require('express');
const router = express.Router();
const {
  addPayment,
  getPaymentsByBooking,
  getAllPayments,
  deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// All payment routes are admin-only
router.use(protect);

router.post('/', addPayment);
router.get('/', getAllPayments);
router.get('/booking/:bookingId', getPaymentsByBooking);
router.delete('/:id', deletePayment);

module.exports = router;
