const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

let storage;

if (!isCloudinaryConfigured) {
  console.error("❌ CRITICAL ERROR: Cloudinary environment variables are missing!");
  // We'll still export a dummy storage to prevent crashing on boot, but it will fail on upload.
}

storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'youthcamping/trips',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
  }
});
console.log('[UPLOAD] Enforcing Cloudinary Storage');

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP allowed.`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
