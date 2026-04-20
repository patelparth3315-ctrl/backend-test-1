const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// @route   POST /api/upload/single
// @desc    Upload a single image
router.post('/single', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  
  // Return the path/url
  const url = req.file.path || `/uploads/trips/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: url
  });
});

// @route   POST /api/upload/multiple
// @desc    Upload multiple images
router.post('/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  
  const urls = req.files.map(file => file.path || `/uploads/trips/${file.filename}`);
  res.status(200).json({
    success: true,
    urls: urls
  });
});

const ticketUpload = require('../middleware/ticketUpload');

// @route   POST /api/upload/ticket
// @desc    Upload a train ticket (PDF/Image)
router.post('/ticket', ticketUpload.single('ticket'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No ticket uploaded' });
  }
  
  const url = `/uploads/tickets/${req.file.filename}`;
  res.status(200).json({
    success: true,
    url: url
  });
});

module.exports = router;
