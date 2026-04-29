const Trip = require('../models/Trip');

// @desc    Get all trips (active only for public)
// @route   GET /api/trips
// @access  Public
// @desc    Get all trips (active only for public)
// @route   GET /api/trips
// @access  Public
exports.getTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const skip = (page - 1) * limit;

    const query = {};
    const status = req.query.status;
    if (status === 'published') query.isActive = true;
    else if (status === 'draft') query.isActive = false;

    // Category filter
    const category = req.query.category;
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const trips = await Trip.find(query)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt')
      .lean();

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      count: trips.length,
      total,
      data: trips.map(t => ({
        ...t,
        id: t._id,
        _id: t._id,
        heroImage: t.heroImage || t.thumbnail || (t.images && t.images[0]) || "",
        status: t.isActive ? 'published' : 'draft'
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip by ID or Slug
// @route   GET /api/trips/:id
// @access  Public
exports.getTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    let trip;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      trip = await Trip.findById(id).lean();
    }

    if (!trip) {
      trip = await Trip.findOne({ slug: id }).lean();
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Fetch related reviews (by ID or by name for legacy data)
    const Review = require('../models/Review');
    const reviews = await Review.find({ 
      $or: [
        { tripId: trip._id },
        { tripName: trip.title }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        ...trip,
        id: trip._id,
        _id: trip._id,
        heroImage: trip.heroImage || trip.thumbnail || (trip.images && trip.images[0]) || "",
        status: trip.isActive ? 'published' : 'draft',
        reviews: reviews || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip by slug
// @route   GET /api/trips/slug/:slug
// @access  Public
exports.getTripBySlug = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug }).lean();
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    // Fetch related reviews (by ID or by name for legacy data)
    const Review = require('../models/Review');
    const reviews = await Review.find({ 
      $or: [
        { tripId: trip._id },
        { tripName: trip.title }
      ]
    }).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        ...trip,
        id: trip._id,
        _id: trip._id,
        heroImage: trip.heroImage || trip.thumbnail || (trip.images && trip.images[0]) || "",
        status: trip.isActive ? 'published' : 'draft',
        reviews: reviews || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new trip
// @route   POST /api/trips
// @access  Private/Admin
exports.createTrip = async (req, res, next) => {
  try {
    const tripData = { ...req.body };
    console.log("🚀 CREATE TRIP REQ BODY:", JSON.stringify(tripData, null, 2));

    if (tripData.status) {
      tripData.isActive = tripData.status === 'published';
    }

    const validateUrls = (obj) => {
      let badUrl = null;
      const traverse = (o) => {
        if (!o || typeof o !== 'object') return;
        for (const key in o) {
          if (typeof o[key] === 'string') {
             const val = o[key];
             if (val.includes('youthcamping.in/wp-content') || 
                 val.startsWith('/uploads/') ||
                 val === 'https://images.unsplash.com/photo-' ||
                 (val.startsWith('photo-') && !val.startsWith('http'))) {
               badUrl = val;
             }
          } else {
             traverse(o[key]);
          }
        }
      };
      traverse(obj);
      return badUrl;
    };

    const invalidUrl = validateUrls(tripData);
    if (invalidUrl) {
      return res.status(400).json({ success: false, message: `Invalid or unsafe image URL detected: ${invalidUrl}` });
    }

    const trip = await Trip.create(tripData);

    // Handle embedded reviews if present
    if (req.body.reviews && Array.isArray(req.body.reviews)) {
      const Review = require('../models/Review');
      for (const revData of req.body.reviews) {
        if (!revData.userName || !revData.comment || String(revData.userName).trim() === '' || String(revData.comment).trim() === '') continue;

        const revPayload = {
          ...revData,
          tripId: trip._id,
          tripName: trip.title,
          isFeatured: revData.isFeatured ?? true
        };
        delete revPayload._id;
        delete revPayload.id;
        await Review.create(revPayload);
      }
    }

    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    console.error("🚨 CREATE TRIP ERROR:", error.message);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: messages,
        receivedData: req.body 
      });
    }
    next(error);
  }
};

// @desc    Update trip
// @route   PUT /api/trips/:id
// @access  Private/Admin
exports.updateTrip = async (req, res, next) => {
  try {
    let trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const tripData = { ...req.body };
    if (tripData.status) {
      tripData.isActive = tripData.status === 'published';
    }

    // Auto-parse stringified arrays if they arrive as strings (Admin Panel bug fix)
    const arrayFields = ['accommodations', 'itinerary', 'variants', 'travelOptions', 'roomOptions', 'highlights', 'inclusions', 'exclusions', 'reviews', 'images', 'gallery'];
    const tryParseArray = (val) => {
      if (typeof val !== 'string') return val;
      if (!val.trim().startsWith('[') && !val.trim().startsWith('{')) return val;
      
      try {
        return JSON.parse(val);
      } catch (e) {
        // Attempt to clean JS-style string literals (e.g. ' + \n)
        try {
          let cleaned = val
            .replace(/'\s*\+\s*\n\s*'/g, '')
            .replace(/"\s*\+\s*\n\s*"/g, '')
            .replace(/\n/g, ' ')
            .replace(/'/g, '"')
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":') // Quote keys
            .replace(/,\s*([\]}])/g, '$1'); // Trailing commas
          return JSON.parse(cleaned);
        } catch (e2) {
          console.warn(`[TRIP UPDATE] Failed all attempts to parse string: ${val.substring(0, 50)}...`);
          return val;
        }
      }
    };

    arrayFields.forEach(field => {
      if (tripData[field]) {
        tripData[field] = tryParseArray(tripData[field]);
      }
    });

    // Extract reviews BEFORE saving to Trip (reviews live in a separate collection)
    const reviewsToProcess = Array.isArray(tripData.reviews) ? tripData.reviews : null;
    delete tripData.reviews; // Don't save reviews array on the Trip document

    const validateUrls = (obj) => {
      let badUrl = null;
      const traverse = (o) => {
        if (!o || typeof o !== 'object') return;
        for (const key in o) {
          if (typeof o[key] === 'string') {
             const val = o[key];
             // Simple heuristic: if it looks like an image URL but is invalid
             if (val.includes('youthcamping.in/wp-content') || 
                 val.startsWith('/uploads/') ||
                 val === 'https://images.unsplash.com/photo-' ||
                 (val.startsWith('photo-') && !val.startsWith('http'))) {
               badUrl = val;
             }
          } else {
             traverse(o[key]);
          }
        }
      };
      traverse(obj);
      return badUrl;
    };

    const invalidUrl = validateUrls(tripData);
    if (invalidUrl) {
      return res.status(400).json({ success: false, message: `Invalid or unsafe image URL detected: ${invalidUrl}` });
    }

    console.log(`[TRIP UPDATE] Saving trip ${req.params.id} with fields:`, Object.keys(tripData).join(', '));
    if (tripData.heroImage) console.log(`[TRIP UPDATE] heroImage: ${tripData.heroImage}`);
    if (tripData.images) console.log(`[TRIP UPDATE] images count: ${tripData.images.length}`);

    trip = await Trip.findByIdAndUpdate(req.params.id, tripData, {
      new: true,
      runValidators: false  // Mixed schema fields cause CastError with validators
    }).lean();

    if (reviewsToProcess) {
      const Review = require('../models/Review');
      for (const revData of reviewsToProcess) {

        // Skip incomplete reviews - check for existence and non-empty strings
        if (!revData.userName || !revData.comment || String(revData.userName).trim() === '' || String(revData.comment).trim() === '') {
          console.log(`[TRIP SYNC] Skipping incomplete review for: ${revData.userName || 'Anonymous'}`);
          continue;
        }

        // Ensure we use the correct Trip ID and Name from the updated trip
        const revPayload = {
          ...revData,
          tripId: trip._id,
          tripName: trip.title,
          isFeatured: revData.isFeatured ?? true
        };

        // If it has a valid-looking ID, update it, otherwise create new
        const hasId = revData._id && revData._id.length === 24;
        const hasAltId = revData.id && revData.id.length === 24;

        if (hasId || hasAltId) {
          await Review.findByIdAndUpdate(hasId ? revData._id : revData.id, revPayload, { upsert: true });
        } else {
          // It's a new review
          delete revPayload._id;
          delete revPayload.id;
          try {
            await Review.create(revPayload);
          } catch (revErr) {
            console.error(`🚨 [REVIEW SYNC] Failed to create review for ${revData.userName}:`, revErr.message);
            // Don't throw, just log and continue to allow trip update to finish
          }
        }
      }
    }


    res.json({ 
      success: true, 
      data: {
        ...trip,
        id: trip._id,
        _id: trip._id,
        heroImage: trip.heroImage || trip.thumbnail || (trip.images && trip.images[0]) || "",
        status: trip.isActive ? 'published' : 'draft'
      } 
    });
  } catch (error) {
    console.error("🚨 UPDATE TRIP ERROR:", error.message);
    const fs = require('fs');
    const logMsg = `ERROR: ${error.message}\nDATA: ${JSON.stringify(req.body, null, 2)}\n\n`;
    fs.appendFileSync('error_log.txt', logMsg);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ 
        success: false, 
        message: "Validation failed", 
        errors: messages,
        receivedData: req.body 
      });
    }
    next(error);
  }
};

// @desc    Delete trip
// @route   DELETE /api/trips/:id
// @access  Private/Admin
exports.deleteTrip = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Trip removed' });
  } catch (error) {
    next(error);
  }
};

exports.seedLiveData = async (req, res, next) => {
  try {
    const DEFAULT_TRAVEL = [
      { label: "Non-AC Sleeper Train", priceDelta: 0, description: "Budget friendly overnight journey in reserved sleeper class." },
      { label: "AC Sleeper Train", priceDelta: 2000, description: "Comfortable air-conditioned sleeper coach for a restful night." },
      { label: "Semi-Sleeper Volvo", priceDelta: 1500, description: "Luxury push-back seating with climate control and charging points." }
    ];

    const DEFAULT_ROOMS = [
      { label: "Quad Sharing", priceDelta: 0 },
      { label: "Triple Sharing", priceDelta: 1000 },
      { label: "Double Sharing", priceDelta: 2500 }
    ];

    const trips = [
      {
        title: "Manali Kasol Amritsar Backpacking Trip",
        slug: "manali-kasol-amritsar-backpacking",
        description: "Get ready for an unforgettable journey through Northern India! Begin with a train journey to Jalandhar. Explore cultural richness at Wagah Border and the serene Golden Temple in Amritsar.",
        heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg",
        price: 11999,
        location: "Himachal & Punjab",
        duration: "8 Nights 9 Days",
        category: "Backpacking",
        images: ["https://vl-prod-static.b-cdn.net/system/images/000/888/076/6f012c2f939c45fd491d86b3d33b0cbb/original/IMG_3309.jpg"],
        highlights: ["Wagah Border", "Golden Temple", "Riverside Kasol"],
        availableDates: [{ date: "2026-05-01", capacity: 99 }, { date: "2026-05-15", capacity: 99 }],
        variants: [
          { location: "Ahmedabad", duration: "11 Days", originalPrice: 15400, discountedPrice: 11999 },
          { location: "Delhi", duration: "7 Days", originalPrice: 13500, discountedPrice: 9999 }
        ],
        travelOptions: DEFAULT_TRAVEL,
        roomOptions: DEFAULT_ROOMS,
        status: "published"
      },
      {
        title: "Winter Spiti Road Trip",
        slug: "winter-spiti",
        description: "Spiti in winter is a world straight out of a postcard — blanketed in pristine white snow.",
        heroImage: "https://vl-prod-static.b-cdn.net/system/images/000/862/062/b7cb9dc7ccc9fe863f0f009c4fe1746f/original/Website_Itinerary_Ohotos__2_.png",
        price: 19999,
        location: "Spiti Valley",
        duration: "9 Nights 10 Days",
        category: "Road Trip",
        availableDates: [{ date: "2026-11-10", capacity: 15 }],
        variants: [{ location: "Chandigarh", duration: "10 Days", originalPrice: 24000, discountedPrice: 19999 }],
        travelOptions: DEFAULT_TRAVEL,
        roomOptions: DEFAULT_ROOMS,
        status: "published"
      }
    ];

    await require('../models/Trip').deleteMany({});
    for (const t of trips) {
      await require('../models/Trip').create(t);
    }
    res.json({ success: true, message: "Seeded live trips via API" });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a photo file
// @route   DELETE /api/upload/photo
// @access  Private/Admin
exports.deletePhoto = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL provided' });
    }

    // Only allow deleting files from /uploads/
    if (!url.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, message: 'Invalid file path' });
    }

    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(__dirname, '../../public', url);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      res.json({ success: true, message: 'File deleted' });
    } else {
      res.status(404).json({ success: false, message: 'File not found' });
    }
  } catch (error) {
    next(error);
  }
};
