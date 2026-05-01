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

    // RBAC: Agents only see their own bookings
    if (req.admin.role === 'agent') {
      query.$or = [
        { salesPersonId: req.admin._id },
        { salesPersonName: req.admin.name }
      ];
    } else if (req.query.salesperson) {
      query.salesPersonName = req.query.salesperson;
    }

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
    if (req.body.paymentMode) updateData.paymentMode = req.body.paymentMode;
    if (req.body.trainTickets !== undefined) updateData.trainTickets = req.body.trainTickets;

    booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // TRIGGER GOOGLE SHEETS SYNC IF ACCEPTED OR CONFIRMED
    const isSyncStatus = status === 'accepted' || status === 'confirmed';
    const wasSyncStatus = booking.status === 'accepted' || booking.status === 'confirmed';
    
    if (isSyncStatus || (wasSyncStatus && !status)) {
      if (booking.syncStatus !== 'synced' || status) {
        await syncBookingToSheets(booking);
      }
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Retry Google Sheets Sync
// @route   POST /api/bookings/:id/retry-sync
// @access  Private/Admin
exports.retrySync = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const result = await syncBookingToSheets(booking);
    res.json({ success: true, message: result ? 'Sync successful' : 'Sync failed', data: booking });
  } catch (error) {
    next(error);
  }
};

// Helper: Sync Booking to Sheets with Tracking
async function syncBookingToSheets(booking) {
  const axios = require('axios');
  const masterScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  
  if (!masterScriptUrl || !masterScriptUrl.startsWith('http')) {
    console.warn('[SYNC] 🚨 Missing AppScript URL in .env');
    booking.syncStatus = 'failed';
    await booking.save();
    return false;
  }

  try {
    booking.syncAttempts = (booking.syncAttempts || 0) + 1;
    booking.lastSyncAt = new Date();
    
    console.log(`[SYNC] 📡 Attempting axios sync for ${booking.bookingId}...`);
    
    const payload = {
      bookingId: booking.bookingId || booking._id,
      timestamp: new Date().toISOString(),
      salesPersonName: booking.salesPersonName || 'Direct',
      name: booking.userName,
      phone: booking.phone,
      email: booking.email,
      tripName: booking.tripTitle,
      date: booking.travelDate ? new Date(booking.travelDate).toISOString().split('T')[0] : 'TBD',
      pickupLocation: booking.pickupCity || 'Not Specified',
      participants: booking.travelers || 1,
      totalAmount: booking.totalAmount || 0,
      paidAmount: booking.paidAmount || 0,
      remainingAmount: (booking.totalAmount || 0) - (booking.paidAmount || 0),
      paymentMode: booking.paymentMode || 'N/A',
      status: booking.status || 'Pending',
      notes: booking.notes || ''
    };

    const response = await axios.post(masterScriptUrl, payload, {
      timeout: 15000,
      maxRedirects: 5,
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`[SYNC] ✅ Result for ${booking.bookingId}:`, response.data);

    if (response.data && response.data.success) {
      booking.syncStatus = 'synced';
    } else {
      console.error('[SYNC] ❌ AppScript returned failure:', response.data?.error);
      booking.syncStatus = 'failed';
    }
    await booking.save();
    return response.data?.success;
  } catch (err) {
    console.error(`[SYNC] 🚨 Fatal Error for ${booking.bookingId}:`, err.message);
    booking.syncStatus = 'failed';
    booking.adminNotes = (booking.adminNotes || '') + `\n[SYNC FAILED ${new Date().toISOString()}]: ${err.message}`;
    await booking.save();
    return false;
  }
}

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
