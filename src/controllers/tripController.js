const Trip = require('../models/Trip');

// @desc    Get all trips (active only for public)
// @route   GET /api/trips
// @access  Public
exports.getTrips = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100; // Increased limit for better sync
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.status === 'published') query.isActive = true;
    else if (req.query.status === 'draft') query.isActive = false;
    // Default: show all if no specific status (useful for admin)

    const trips = await Trip.find(query)
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Trip.countDocuments(query);

    res.json({
      success: true,
      count: trips.length,
      total,
      data: trips.map(t => ({
        id: t._id,
        _id: t._id,
        title: t.title,
        location: t.location,
        price: t.price,
        duration: t.duration,
        category: t.category,
        description: t.description,
        heroImage: t.thumbnail || t.images[0],
        images: t.images,
        status: t.isActive ? 'published' : 'draft',
        itinerary: t.itinerary,
        highlights: t.highlights,
        inclusions: t.inclusions,
        exclusions: t.exclusions,
        createdAt: t.createdAt
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

    // Try finding by ID first if it looks like an ObjectId
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      trip = await Trip.findById(id);
    }

    // If not found by ID or not an ID format, try finding by slug
    if (!trip) {
      trip = await Trip.findOne({ 
        $or: [
          { slug: id },
          { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }
        ].filter(q => q._id || q.slug)
      });
    }

    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    
    // Map to normalized format
    const data = {
      ...trip._doc,
      id: trip._id,
      heroImage: trip.thumbnail || trip.images[0]
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip by slug
// @route   GET /api/trips/slug/:slug
// @access  Public
exports.getTripBySlug = async (req, res, next) => {
  try {
    const trip = await Trip.findOne({ slug: req.params.slug });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }

    const data = {
      ...trip._doc,
      id: trip._id,
      heroImage: trip.thumbnail || trip.images[0]
    };

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new trip
// @route   POST /api/trips
// @access  Private/Admin
exports.createTrip = async (req, res, next) => {
  try {
    if (req.body.status) {
      req.body.isActive = req.body.status === 'published';
    }
    if (req.body.heroImage) {
      req.body.thumbnail = req.body.heroImage;
    } else if (req.body.thumbnail) {
      req.body.heroImage = req.body.thumbnail;
    }
    const trip = await Trip.create(req.body);
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
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

    if (req.body.status) {
      req.body.isActive = req.body.status === 'published';
    }
    if (req.body.heroImage) {
      req.body.thumbnail = req.body.heroImage;
    } else if (req.body.thumbnail) {
      req.body.heroImage = req.body.thumbnail;
    }
    trip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: trip });
  } catch (error) {
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
