const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary (User needs to provide these in .env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
  api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder',
});

// Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'youthcamping/trips',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 800, crop: 'limit' }]
  },
});

// For Local Fallback (if Cloudinary is not configured)
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/uploads/trips');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: process.env.CLOUDINARY_CLOUD_NAME ? storage : localStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;
