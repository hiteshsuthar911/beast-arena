const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  gameTitle: { type: String, required: true },
  prizePool: { type: Number, required: true },
  maxPlayers: { type: Number, required: true },
  rules: { type: String },
  driveLink: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  registrationFields: { type: [String], default: [] },
  closesAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', EventSchema);
