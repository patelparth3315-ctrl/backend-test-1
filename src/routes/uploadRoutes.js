const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// ── DELETE /api/upload/photo ──
// Physically removes a file from uploads directory
router.delete('/photo', (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'No URL provided' });
    }

    // Only allow deleting files from /uploads/
    if (!url.startsWith('/uploads/')) {
      return res.status(400).json({ success: false, message: 'Invalid file path - must start with /uploads/' });
    }

    const fullPath = path.join(__dirname, '../../public', url);
    console.log(`[DELETE PHOTO] Attempting to delete: ${fullPath}`);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[DELETE PHOTO] ✅ Deleted: ${fullPath}`);
      res.json({ success: true, message: 'File deleted' });
    } else {
      console.log(`[DELETE PHOTO] ⚠️ File not found (already deleted?): ${fullPath}`);
      res.json({ success: true, message: 'File not found (may already be deleted)' });
    }
  } catch (error) {
    console.error('[DELETE PHOTO] ❌ Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/upload/single ──
// Upload a single image and return its persistent URL
router.post('/single', upload.single('image'), (req, res) => {
  console.log('[UPLOAD SINGLE] File received:', req.file ? (req.file.originalname || 'Yes') : 'NONE');

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  let url;
  if (req.file && req.file.path) {
    url = req.file.path;
    console.log('[UPLOAD SINGLE] ✅ Saved to Cloudinary:', url);
  } else {
    return res.status(500).json({ success: false, message: 'Cloudinary upload failed - no URL returned' });
  }

  res.status(200).json({
    success: true,
    url: url,
    size: req.file.size,
    filename: req.file.filename || req.file.originalname
  });
});

// ── POST /api/upload/multiple ──
// Upload multiple images and return their persistent URLs
router.post('/multiple', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }

  const urls = [];
  for (const file of req.files) {
    if (file.path) {
      urls.push(file.path);
      console.log(`[UPLOAD MULTI] ✅ Saved to Cloudinary: ${file.path}`);
    }
  }

  res.status(200).json({
    success: true,
    urls: urls,
    count: urls.length
  });
});

// ── POST /api/upload/ticket ──
const ticketUpload = require('../middleware/ticketUpload');
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

// ── GET /api/upload/verify ──
// Debug endpoint to check if a file exists on disk
router.get('/verify', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, message: 'Provide ?url= parameter' });
  }

  const fullPath = path.join(__dirname, '../../public', url);
  const exists = fs.existsSync(fullPath);
  const stats = exists ? fs.statSync(fullPath) : null;

  res.json({
    success: true,
    url,
    exists,
    size: stats ? stats.size : 0,
    fullPath: exists ? fullPath : null
  });
});

module.exports = router;
