const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});
schema.index({ jobId: 1, applicantId: 1 }, { unique: true });
module.exports = mongoose.models.JobApplication || mongoose.model('JobApplication', schema);