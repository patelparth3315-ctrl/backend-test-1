const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  status: { type: String, default: 'Draft' },
  clientName: { type: String, required: true },
  destination: { type: String, required: true },
  pax: { type: Number, default: 2 },
  travelDates: {
    from: String,
    to: String
  },
  duration: String,
  lowLevelPrice: Number,
  highLevelPrice: Number,
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quotation', quotationSchema);
