const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  
  // Traveler Info
  travelerName: { type: String, required: true },
  travelerPhone: { type: String, required: true },
  travelerEmail: { type: String, required: true },
  
  // Payment Info
  paymentType: { type: String, enum: ['advance', 'full'], required: true },
  amountPaid: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  
  // Razorpay Meta
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  
  status: { 
    type: String, 
    enum: ['pending', 'advance_paid', 'full_paid', 'failed'], 
    default: 'pending' 
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
