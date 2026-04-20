
// models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: String,
  status: String,
  createdAt: Date,
  userId: String
});

module.exports = mongoose.model('Job', JobSchema);
