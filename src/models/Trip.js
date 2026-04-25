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
  gallery: [{ 
    url: String, 
    alt: String, 
    order: Number 
  }],
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
  availableDates: [{
    date: Date,
    capacity: { type: Number, default: 20 },
    bookedCount: { type: Number, default: 0 }
  }],
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
    answer: String,
    order: Number
  }],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  customSections: [{
    label: String,
    content: String
  }],
  attractions: [{
    name: String,
    description: String,
    image: String,
    slug: String,
    order: Number
  }],
  activities: [{
    name: String,
    description: String,
    image: String,
    slug: String,
    order: Number
  }],
  accommodations: [new mongoose.Schema({
    name: String,
    location: String,
    nights: String,
    type: String,
    starRating: String,
    roomType: String,
    meals: String,
    image: String,
    gallery: [{
      url: String,
      category: { type: String, default: 'All' }
    }]
  }, { _id: false })],
  popupDetails: {
    cancellation: [{ 
      label: String, 
      val: String 
    }],
    gears: [{
      item: String,
      price: String
    }],
    terms: [String],
    carry: [{
      label: String,
      val: String
    }],
    etiquette: [{
      title: String,
      desc: String
    }]
  },
  videos: [{
    id: String,
    title: String
  }],
  reels: [{
    url: String,
    thumbnail: String,
    caption: String
  }],
  route: [{
    label: String,
    icon: { type: String, default: "car" }
  }],
  stickyCardPrice: Number,
  stickyCardLabel: String, // e.g. "per person"
  seo: {
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
    focusKeyword: { type: String, trim: true },
    ogImage: { type: String },
    canonicalUrl: { type: String },
    faqSchema: [{
      question: String,
      answer: String
    }],
    internalLinks: [{
      tripId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
      label: String
    }]
  }
}, {
  timestamps: true
});

// Trip auto-generated fields in pre-save hook
tripSchema.pre('save', function(next) {
  // Slug
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  
  // Auto SEO Logic
  if (this.isModified('title') || this.isModified('location')) {
    if (!this.seo.metaTitle) {
      this.seo.metaTitle = `${this.title} | ${this.duration} ${this.location} Tour`;
    }
    if (!this.seo.metaDescription) {
      this.seo.metaDescription = `Book your ${this.title} at best prices. Experience ${this.location} like never before with YouthCamping. ${this.duration} of adventure and fun.`;
    }
    if (!this.seo.focusKeyword) {
      this.seo.focusKeyword = `${this.title} ${this.location}`;
    }
  }

  // Map status to isActive for backward compatibility with existing queries
  if (this.isModified('status')) {
    this.isActive = this.status === 'published';
  }
  
  next();
});

// Indexes for performance
tripSchema.index({ isActive: 1 });
tripSchema.index({ category: 1 });
tripSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Trip', tripSchema);
