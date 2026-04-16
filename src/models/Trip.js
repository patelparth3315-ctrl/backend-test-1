const mongoose = require('mongoose');
const slugify = require('slugify');

const tripSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  shortName: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  originalUrl: String,
  location: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  maxGroupSize: {
    type: Number,
    default: 20
  },
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'hard'],
    default: 'moderate'
  },
  description: {
    type: String,
    required: true
  },
  departureCity: String,
  ageLimit: String,
  bookingUrl: String,
  highlights: [String],
  inclusions: [String],
  exclusions: [String],
  images: [String],
  gallery: [String],
  thumbnail: String,
  heroImage: String,
  itinerary: [{
    day: Number,
    title: String,
    description: String,
    location: String,
    activities: [String],
    stay: String,
    meals: String,
    photos: [String]
  }],
  availableDates: [Date],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'himalayan'
  },
  tags: [String],
  variants: [{
    location: String,
    duration: String,
    originalPrice: Number,
    discountedPrice: Number,
    image: String
  }],
  travelOptions: [{
    label: String,
    priceDelta: Number,
    description: String
  }],
  roomOptions: [{
    label: String,
    priceDelta: Number
  }],
  addons: [{
    name: String,
    rate: Number,
    description: String,
    minQuantity: { type: Number, default: 1 },
    maxQuantity: { type: Number, default: 99 }
  }],
  faqs: [{
    question: String,
    answer: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  }
}, {
  timestamps: true
});

// Trip auto-generated fields in pre-save hook
tripSchema.pre('save', function(next) {
  // Slug
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Map status to isActive for backward compatibility with existing queries
  if (this.isModified('status')) {
    this.isActive = this.status === 'published';
  }
  
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
