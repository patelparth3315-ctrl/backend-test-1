const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/auth');

// Public route
router.post('/', createInquiry);

// Admin routes
const requireRole = require('../middleware/role');
router.get('/', protect, requireRole('agent'), getInquiries);
router.get('/:id', protect, requireRole('agent'), getInquiry);
router.patch('/:id/status', protect, requireRole('agent'), updateInquiryStatus);
router.delete('/:id', protect, requireRole('agent'), deleteInquiry);

module.exports = router;
