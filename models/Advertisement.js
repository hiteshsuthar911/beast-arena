const mongoose = require('mongoose');

const AdvertisementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  imageUrl: { type: String },
  buttonText: { type: String, default: 'Register Now' },
  buttonUrl: { type: String },
  prizePool: { type: String },
  eventDate: { type: String },
  entryFee: { type: String },
  closesAt: { type: Date },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Advertisement', AdvertisementSchema);
