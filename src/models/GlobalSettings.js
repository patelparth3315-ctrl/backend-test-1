const mongoose = require('mongoose');

const globalSettingsSchema = new mongoose.Schema({
  logo: { 
    url: String, 
    alt: String 
  },
  navbarLinks: [{ 
    label: String, 
    href: String, 
    order: Number 
  }],
  footer: { 
    tagline: String, 
    copyright: String, 
    columns: mongoose.Schema.Types.Mixed 
  },
  social: { 
    instagram: String, 
    facebook: String, 
    youtube: String, 
    whatsapp: String 
  },
  contact: { 
    phone: String, 
    email: String, 
    address: String 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('GlobalSettings', globalSettingsSchema);
