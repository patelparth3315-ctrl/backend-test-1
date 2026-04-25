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
const requireRole = require('../middleware/role');
router.post('/', protect, requireRole('agent'), createTrip);
router.put('/:id', protect, requireRole('agent'), updateTrip);
router.delete('/:id', protect, requireRole('agent'), deleteTrip);

module.exports = router;
