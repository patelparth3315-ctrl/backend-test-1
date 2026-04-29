const Review = require('../models/Review');

// @desc    Get all reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.featured === 'true') query.isFeatured = true;

    const reviews = await Review.find(query).sort('-createdAt');

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a review
// @route   POST /api/reviews
// @access  Public (or semi-protected)
exports.createReview = async (req, res, next) => {
  try {
    const FALLBACK_URL = "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070";
    const sanitizeAndValidateUrls = (obj) => {
      let rejectedUrl = null;
      const traverse = (o) => {
        if (!o || typeof o !== 'object') return;
        for (const key in o) {
          if (typeof o[key] === 'string') {
            const val = o[key].trim();
            if (!val) continue;
            if (val.includes('youthcamping.in/wp-content') || val.startsWith('/uploads/')) {
              o[key] = FALLBACK_URL;
            } else if (val === 'https://images.unsplash.com/photo-' || (val.startsWith('photo-') && !val.startsWith('http'))) {
              rejectedUrl = val;
            }
          } else {
            traverse(o[key]);
          }
        }
      };
      traverse(obj);
      return rejectedUrl;
    };

    const invalidUrl = sanitizeAndValidateUrls(req.body);
    if (invalidUrl) {
      return res.status(400).json({ success: false, message: `Invalid image URL detected: ${invalidUrl}` });
    }

    const review = await Review.create(req.body);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private/Admin
exports.updateReview = async (req, res, next) => {
  try {
    const FALLBACK_URL = "https://images.unsplash.com/photo-1596230529625-7ee10f7b09b6?q=80&w=2070";
    const sanitizeAndValidateUrls = (obj) => {
      let rejectedUrl = null;
      const traverse = (o) => {
        if (!o || typeof o !== 'object') return;
        for (const key in o) {
          if (typeof o[key] === 'string') {
            const val = o[key].trim();
            if (!val) continue;
            if (val.includes('youthcamping.in/wp-content') || val.startsWith('/uploads/')) {
              o[key] = FALLBACK_URL;
            } else if (val === 'https://images.unsplash.com/photo-' || (val.startsWith('photo-') && !val.startsWith('http'))) {
              rejectedUrl = val;
            }
          } else {
            traverse(o[key]);
          }
        }
      };
      traverse(obj);
      return rejectedUrl;
    };

    const invalidUrl = sanitizeAndValidateUrls(req.body);
    if (invalidUrl) {
      return res.status(400).json({ success: false, message: `Invalid image URL detected: ${invalidUrl}` });
    }

    const review = await Review.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};
