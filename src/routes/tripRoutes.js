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
router.get('/:id', getTrip);
router.get('/slug/:slug', getTripBySlug);

// Admin routes
router.post('/', protect, createTrip);
router.put('/:id', protect, updateTrip);
router.delete('/:id', protect, deleteTrip);

module.exports = router;
