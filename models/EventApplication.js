const mongoose = require('mongoose');

const EventApplicationSchema = new mongoose.Schema({
  eventId: { type: String, required: true },
  fullName: { type: String },
  age: { type: Number },
  email: { type: String },
  discordUsername: { type: String },
  phone: { type: String },
  hasWorkingMic: { type: Boolean },
  game: { type: String },
  ign: { type: String },
  uid: { type: String },
  rank: { type: String },
  device: { type: String },
  whySelect: { type: String },
  creatorLink: { type: String },
  teamStatus: { type: String },
  teamName: { type: String },
  secondaryGames: { type: [String] },
  referral: { type: String },
  agreedToTerms: { type: Boolean },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EventApplication', EventApplicationSchema);
