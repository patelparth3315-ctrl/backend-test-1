const Booking = require('../models/Booking');
const Trip = require('../models/Trip');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = async (req, res, next) => {
  try {
    const { tripId, travelers } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Auto-calculate total amount
    const totalAmount = trip.price * travelers;

    const booking = await Booking.create({
      ...req.body,
      userId: req.user.id,
      totalAmount
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
exports.getBookings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status) query.status = req.query.status;

    const bookings = await Booking.find(query)
      .populate('tripId', 'title')
      .populate('userId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings.map(b => ({
        id: b._id,
        userName: b.userName || b.name || 'Guest',
        email: b.email,
        phone: b.phone,
        tripId: b.tripId?._id || b.tripId,
        tripTitle: b.tripId?.title || b.tripTitle || 'Trip',
        status: b.status,
        paymentStatus: b.paymentStatus,
        amount: b.totalAmount || 0,
        paidAmount: b.paidAmount || 0,
        adminNotes: b.adminNotes,
        trainTickets: b.trainTickets || [],
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private/Admin
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('tripId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking status/notes
// @route   PATCH /api/bookings/:id/status
// @access  Private/Admin
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, adminNotes, paidAmount } = req.body;
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (paidAmount !== undefined) updateData.paidAmount = paidAmount;
    if (req.body.trainTickets !== undefined) updateData.trainTickets = req.body.trainTickets;

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: {
        id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        adminNotes: booking.adminNotes,
        paidAmount: booking.paidAmount,
        trainTickets: booking.trainTickets
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update booking (full)
// @route   PUT /api/bookings/:id
// @access  Private/Admin
exports.updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};
// @desc    Get logged in user bookings
// @route   GET /api/users/bookings
// @access  Private/User
exports.getMyBookings = async (req, res, next) => {
  try {
    // Find bookings by either userId OR the user's email address
    // This allows manual bookings added by admin to show up for the traveler
    const bookings = await Booking.find({
      $or: [
        { userId: req.user.id },
        { email: req.user.email }
      ]
    })
      .populate({
        path: 'tripId',
        select: 'title location price images itinerary thumbnail'
      })
      .sort('-createdAt');

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};
