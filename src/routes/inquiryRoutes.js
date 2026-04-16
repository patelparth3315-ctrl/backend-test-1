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
router.get('/', protect, getInquiries);
router.get('/:id', protect, getInquiry);
router.patch('/:id/status', protect, updateInquiryStatus);
router.delete('/:id', protect, deleteInquiry);

module.exports = router;
