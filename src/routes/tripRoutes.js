const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTrip,
  getTripBySlug,
  createTrip,
  updateTrip,
  deleteTrip,
  seedLiveData
} = require('../controllers/tripController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getTrips);
router.get('/seed/live-data', seedLiveData);
router.get('/slug/:slug', getTripBySlug);
router.get('/:id', getTrip);

// Admin routes
const authorize = require('../middleware/role');
router.post('/', protect, authorize('admin', 'manager'), createTrip);
router.put('/:id', protect, authorize('admin', 'manager'), updateTrip);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteTrip);

module.exports = router;
