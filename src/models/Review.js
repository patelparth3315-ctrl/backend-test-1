const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  userImage: {
    type: String,
    default: 'https://i.pravatar.cc/150?u=default'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  tripName: String,
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);
