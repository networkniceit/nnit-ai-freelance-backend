// models/Agent.js
const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  status: String,
  createdAt: Date,
  jobId: String
});

module.exports = mongoose.model('Agent', AgentSchema);
