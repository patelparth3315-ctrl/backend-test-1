const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

/**
 * Recalculates paidAmount, paymentStatus, and booking status
 * based on the SUM of all linked payments.
 */
async function syncBookingFromPayments(bookingId) {
  const payments = await Payment.find({ bookingId });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const booking = await Booking.findById(bookingId);
  if (!booking) return;

  const totalAmount = booking.totalAmount || 0;

  // Derive statuses
  let paymentStatus = 'unpaid';
  let bookingStatus = booking.status; // keep existing unless we auto-update

  if (totalPaid >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
    // Auto-confirm booking when fully paid (unless cancelled/completed)
    if (bookingStatus !== 'cancelled' && bookingStatus !== 'completed') {
      bookingStatus = 'confirmed';
    }
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
    // If booking was pending, keep it pending (partial doesn't auto-confirm)
  }
  // else totalPaid === 0 => 'unpaid', status stays as-is

  await Booking.findByIdAndUpdate(bookingId, {
    paidAmount: totalPaid,
    paymentStatus,
    status: bookingStatus
  });
}

// @desc    Add payment to a booking
// @route   POST /api/payments
// @access  Private/Admin
exports.addPayment = async (req, res, next) => {
  try {
    const { bookingId, amount, paymentMode, paymentDate, reference, notes } = req.body;

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Validate amount doesn't exceed remaining balance
    const existingPayments = await Payment.find({ bookingId });
    const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = (booking.totalAmount || 0) - totalPaid;

    if (amount > remaining && remaining > 0) {
      return res.status(400).json({
        success: false,
        message: `Payment exceeds remaining balance of ₹${remaining.toLocaleString()}`
      });
    }

    const payment = await Payment.create({
      bookingId,
      amount,
      paymentMode,
      paymentDate: paymentDate || new Date(),
      reference,
      notes
    });

    // Sync booking totals and status
    await syncBookingFromPayments(bookingId);

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments for a booking
// @route   GET /api/payments/booking/:bookingId
// @access  Private/Admin
exports.getPaymentsByBooking = async (req, res, next) => {
  try {
    const payments = await Payment.find({ bookingId: req.params.bookingId })
      .sort('-paymentDate');

    const booking = await Booking.findById(req.params.bookingId);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    res.json({
      success: true,
      data: payments,
      summary: {
        totalAmount: booking?.totalAmount || 0,
        totalPaid,
        pending: (booking?.totalAmount || 0) - totalPaid,
        count: payments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (admin overview)
// @route   GET /api/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    const payments = await Payment.find()
      .populate({
        path: 'bookingId',
        select: 'userName email tripId totalAmount',
        populate: { path: 'tripId', select: 'title' }
      })
      .skip(skip)
      .limit(limit)
      .sort('-paymentDate');

    const total = await Payment.countDocuments();
    const totalRevenue = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      success: true,
      data: payments,
      total,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
exports.deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const bookingId = payment.bookingId;
    await Payment.findByIdAndDelete(req.params.id);

    // Resync booking after deletion
    await syncBookingFromPayments(bookingId);

    res.json({ success: true, message: 'Payment deleted and booking resynchronized' });
  } catch (error) {
    next(error);
  }
};
