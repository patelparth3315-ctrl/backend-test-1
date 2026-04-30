const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const isCloudinaryConfigured = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (!isCloudinaryConfigured) {
  console.warn('⚠️  Cloudinary is not fully configured. The following variables are missing:');
  if (!process.env.CLOUDINARY_CLOUD_NAME) console.warn('   - CLOUDINARY_CLOUD_NAME');
  if (!process.env.CLOUDINARY_API_KEY) console.warn('   - CLOUDINARY_API_KEY');
  if (!process.env.CLOUDINARY_API_SECRET) console.warn('   - CLOUDINARY_API_SECRET');
  console.warn('   Fallback to local storage may be needed if production keys are not set in Render/Vercel.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

let storage;

if (!isCloudinaryConfigured) {
  console.error("❌ CRITICAL ERROR: Cloudinary environment variables are missing!");
  // We'll still export a dummy storage to prevent crashing on boot, but it will fail on upload.
}

storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'youthcamping/trips',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 1200, crop: 'limit' }, { fetch_format: 'auto', quality: 'auto' }]
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
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter
});

module.exports = upload;
