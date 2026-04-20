// models/RateLimitLog.js
const mongoose = require('mongoose');

const RateLimitLogSchema = new mongoose.Schema({
  ip: String,
  endpoint: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.models.RateLimitLog || mongoose.model('RateLimitLog', RateLimitLogSchema);
