const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'YouthCamping'
  },
  contactEmail: {
    type: String,
    default: 'youthcampingmedia@gmail.com'
  },
  contactPhone: {
    type: String,
    default: '+919924246267'
  },
  address: {
    type: String,
    default: ''
  },
  currency: {
    type: String,
    default: 'INR'
  },
  socialLinks: {
    facebook: { type: String, default: 'https://facebook.com/youthcamping/' },
    instagram: { type: String, default: 'https://instagram.com/youthcamping.in/' },
    twitter: { type: String, default: '' },
    youtube: { type: String, default: 'https://youtube.com/channel/UC378U1Xiw7ZWCdj84FFVFtw' },
    linkedin: { type: String, default: 'https://linkedin.com/company/youthcamping-in' }
  },
  logo: {
    type: String,
    default: ''
  },
  favicon: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', SettingsSchema);
