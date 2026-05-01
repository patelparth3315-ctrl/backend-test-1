const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tripTitle: {
    type: String
  },
  travelers: {
    type: Number,
    required: true,
    min: 1
  },
  travelDate: Date,
  totalAmount: Number,
  paidAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'partial', 'paid'],
    default: 'unpaid'
  },
  notes: String,
  adminNotes: String,
  trainTickets: [{
    pnr: String,
    trainNo: String,
    trainName: String,
    from: String,
    to: String,
    departureDate: Date,
    arrivalDate: Date,
    coach: String,
    seat: String,
    status: {
      type: String,
      default: 'Confirmed'
    },
    ticketUrl: String
  }],
  participantsList: [{
    name: String,
    phone: String,
    govId: String,
    age: Number,
    gender: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
bookingSchema.index({ userId: 1 });
bookingSchema.index({ email: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
