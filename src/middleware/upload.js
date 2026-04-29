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

if (isCloudinaryConfigured) {
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'youthcamping/trips',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  });
  console.log('[UPLOAD] Using Cloudinary Storage');
} else {
  const uploadsDir = path.join(__dirname, '../../public/uploads/trips');

  // Ensure directory exists on startup
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('[UPLOAD] Created uploads directory:', uploadsDir);
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/__+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    }
  });
  console.log('[UPLOAD] Using Local Storage');
}

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
