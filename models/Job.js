const mongoose = require('mongoose');
const { randomUUID } = require('node:crypto');
const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: () => randomUUID() },
  type: String,
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now },
  userId: String,
  title: { type: String, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 10000 },
  budget: { type: Number, min: 0 },
  skills: [String]
});
module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema);