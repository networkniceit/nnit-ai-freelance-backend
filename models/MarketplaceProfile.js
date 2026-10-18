'use strict';
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  skills: { type: [String], default: [] },
  hourlyRate: { type: Number, required: true, min: 0 },
  bio: { type: String, default: '', maxlength: 5000 },
  experience: { type: String, default: '', maxlength: 5000 },
  available: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.models.MarketplaceProfile || mongoose.model('MarketplaceProfile', schema);
