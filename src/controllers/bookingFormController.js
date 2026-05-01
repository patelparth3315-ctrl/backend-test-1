const BookingForm = require('../models/BookingForm');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');

// @desc    Create or retrieve booking form link for a trip+date
// @route   POST /api/booking-forms/create
// @access  Private/Admin
exports.createBookingForm = async (req, res, next) => {
  try {
    const { tripName, date, tripId } = req.body;

    if (!tripName || !date) {
      return res.status(400).json({
        success: false,
        message: 'Trip name and date are required'
      });
    }

    // 1. Check if record already exists
    let record = await BookingForm.findOne({ tripName, date });
    if (record) {
      return res.json({
        success: true,
        data: record,
        message: 'Link already exists'
      });
    }

    // 2. Initialize the tab in the Master Google Sheet
    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    let sheetUrl = "";
    
    if (appsScriptUrl) {
      try {
        const response = await fetch(appsScriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tripName, date, isInit: true, name: "SYSTEM_INIT" })
        });
        const result = await response.json();
        sheetUrl = result.sheetUrl || "";
      } catch (err) {
        console.error('[BOOKING-FORM] Sheet Init Error:', err);
      }
    }

    // 3. Store the record in our DB
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const internalUrl = `${frontendUrl}/book?trip=${encodeURIComponent(tripName)}&date=${encodeURIComponent(date)}`;

    record = await BookingForm.create({
      tripId: tripId || null,
      tripName,
      date,
      formUrl: internalUrl,
      sheetUrl: sheetUrl || "Master Sheet",
    });

    res.status(201).json({ success: true, data: record });
  } catch (error) {
    if (error.code === 11000) {
      const existing = await BookingForm.findOne({
        tripName: req.body.tripName,
        date: req.body.date
      });
      return res.json({
        success: true,
        data: existing,
        message: 'Link already exists (race condition resolved)'
      });
    }
    next(error);
  }
};

// @desc    Get all booking forms
// @route   GET /api/booking-forms
// @access  Private/Admin
exports.getBookingForms = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.tripName) query.tripName = req.query.tripName;

    const forms = await BookingForm.find(query)
      .sort('-createdAt')
      .limit(100);

    res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booking form by trip+date
// @route   GET /api/booking-forms/lookup
// @access  Private/Admin
exports.lookupBookingForm = async (req, res, next) => {
  try {
    const { tripName, date } = req.query;
    if (!tripName || !date) {
      return res.status(400).json({
        success: false,
        message: 'tripName and date query params required'
      });
    }

    const form = await BookingForm.findOne({ tripName, date });
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'No form found for this trip and date'
      });
    }

    res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a booking form record
// @route   DELETE /api/booking-forms/:id
// @access  Private/Admin
exports.deleteBookingForm = async (req, res, next) => {
  try {
    const form = await BookingForm.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    await BookingForm.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Form record deleted (Google Form/Sheet must be deleted manually)'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate share message
// @route   POST /api/booking-forms/share-message
// @access  Private/Admin
exports.getShareMessage = async (req, res, next) => {
  try {
    const { tripName, date, formUrl } = req.body;

    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const message = `Hello 😊\n\nPlease complete your booking here:\n${formUrl}\n\nTrip: ${tripName}\nDate: ${formattedDate}\n\nTeam YouthCamping 🏕️`;

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit booking from public form to Master Google Sheet
// @route   POST /api/booking-forms/public-submit
// @access  Public
exports.createPublicBooking = async (req, res, next) => {
  try {
    const { 
      tripName, date, name, phone, email, participants, 
      roomSharing, trainOption, participantsList 
    } = req.body;

    // 1. Basic Validation
    if (!tripName || !name || !phone) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // 2. Push to Master Google Sheet
    const masterScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    if (masterScriptUrl) {
      fetch(masterScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripName, date, name, phone, email, participants, roomSharing, trainOption, participantsList
        })
      }).catch(err => console.error('[MASTER-SHEET] Sync Error:', err));
    }

    // 3. Find the trip to get tripId
    const trip = await Trip.findOne({ title: { $regex: new RegExp(`^${tripName}$`, 'i') } });
    
    // 4. Create a pending booking in our system (CRM Integration)
    const newBooking = await Booking.create({
      userName: name,
      email: email || 'no-email@youthcamping.in',
      phone: phone,
      tripId: trip ? trip._id : null,
      tripTitle: tripName,
      totalAmount: trip ? trip.price : 0,
      travelers: participants || 1,
      status: 'pending',
      paidAmount: 0,
      participantsList: participantsList || [],
      notes: `Source: Public Unified Form. Trip Name: ${tripName}. Sharing: ${roomSharing}, Train: ${trainOption}`
    });



    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully',
      data: newBooking
    });

  } catch (error) {
    next(error);
  }
};
