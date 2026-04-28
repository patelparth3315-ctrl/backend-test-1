const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ── STORAGE: Always use local disk storage ──
// Cloudinary is not configured in .env, so we use reliable local storage.
// The uploads directory is served statically by express in server.js.

const uploadsDir = path.join(__dirname, '../../public/uploads/trips');

// Ensure directory exists on startup
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('[UPLOAD] Created uploads directory:', uploadsDir);
}

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename: remove spaces and special chars
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/__+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP allowed.`), false);
  }
};

const upload = multer({
  storage: localStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
