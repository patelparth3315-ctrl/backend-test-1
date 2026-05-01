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
    const axios = require('axios');
    const appsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    let sheetUrl = "";
    console.log('[BOOKING-FORM] 📡 Attempting Axios Sheet Init for:', tripName);
    
    if (appsScriptUrl && appsScriptUrl.startsWith('http')) {
      try {
        const response = await axios.post(appsScriptUrl, {
          tripName, date, isInit: true, name: "SYSTEM_INIT"
        }, {
          timeout: 20000,
          maxRedirects: 5
        });

        if (response.data && response.data.success) {
          console.log('[BOOKING-FORM] ✅ Sheet Init SUCCESS');
          sheetUrl = response.data.sheetUrl || "";
        } else {
          console.error('[BOOKING-FORM] ❌ Sheet Init FAILED:', response.data?.error);
        }
      } catch (err) {
        console.error('[BOOKING-FORM] 🚨 Axios Sheet Init Error:', err.message);
      }
    } else {
      console.warn('[BOOKING-FORM] ⚠️ Skipping Sheet Init: GOOGLE_APPS_SCRIPT_URL missing in .env');
    }


    // 3. Store the record in our DB
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const internalUrl = `${frontendUrl}/book?trip=${encodeURIComponent(tripName)}&date=${encodeURIComponent(date)}`;

    record = await BookingForm.create({
      tripId: tripId || null,
      tripName,
      date,
      formUrl: internalUrl,
      sheetUrl: sheetUrl || "",
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

// @desc    Update a booking form (e.g. manual sheet URL)
// @route   PUT /api/booking-forms/:id
// @access  Private/Admin
exports.updateBookingForm = async (req, res, next) => {
  try {
    const form = await BookingForm.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!form) {
      return res.status(404).json({ success: false, message: 'Form not found' });
    }

    res.json({ success: true, data: form });
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

    // 1b. Check Trip Capacity & Cutoff Date
    const trip = await Trip.findOne({ title: { $regex: new RegExp(`^${tripName}$`, 'i') } });
    if (trip && trip.availableDates) {
      const selectedDateObj = trip.availableDates.find(d => {
        const dStr = new Date(d.date).toISOString().split('T')[0];
        return dStr === date;
      });

      if (selectedDateObj) {
        // Cutoff check
        const now = new Date();
        const tripDate = new Date(selectedDateObj.date);
        const diffDays = Math.ceil((tripDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        if (diffDays < (selectedDateObj.cutoffDays || 0)) {
          return res.status(400).json({ success: false, message: 'Bookings for this date are now closed.' });
        }

        // Capacity check
        if (selectedDateObj.bookedCount + (participants || 1) > selectedDateObj.capacity) {
          return res.status(400).json({ success: false, message: 'Sorry, this batch is full. Please choose another date or contact support for the waitlist.' });
        }

        // Increment bookedCount (optimistic)
        selectedDateObj.bookedCount += (participants || 1);
        await trip.save();
      }
    }

    // 1c. Check for existing booking (Duplicate Prevention)
    if (name !== 'TESTER') {
      const existingBooking = await Booking.findOne({ 
        phone, 
        tripTitle: tripName 
      });

      if (existingBooking) {
        return res.json({ 
          success: true, 
          message: 'Your booking is already saved! Our team will contact you soon.',
          data: existingBooking 
        });
      }
    }

    // 2. Generate Unique Booking ID
    const bookingId = "YC-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    // 3. Find the trip to get tripId (reuse already found trip)
    // const trip = await Trip.findOne({ title: { $regex: new RegExp(`^${tripName}$`, 'i') } });
    
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
      pickupCity: req.body.pickupCity || '',
      specialRequests: req.body.specialRequests || '',
      idProofUrl: req.body.idProofUrl || '',
      salesPersonName: req.body.salesPersonName || 'Direct',
      bookingId: bookingId,
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
