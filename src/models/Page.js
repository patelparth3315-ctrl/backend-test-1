const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  sections: {
    type: Array, // Array of { id: string, type: string, data: object }
    default: []
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    focusKeyword: String,
    ogImage: String,
    canonicalUrl: String,
    faqSchema: [{
      question: String,
      answer: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  isSystem: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Page', PageSchema);
