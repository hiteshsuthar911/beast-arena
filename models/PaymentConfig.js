const mongoose = require('mongoose');

const PaymentConfigSchema = new mongoose.Schema({
  razorpayKeyId: { type: String, default: '' },
  razorpayKeySecret: { type: String, default: '' },
  isPaymentEnabled: { type: Boolean, default: true }
});

module.exports = mongoose.model('PaymentConfig', PaymentConfigSchema);
