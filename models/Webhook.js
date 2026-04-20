// models/Webhook.js
const mongoose = require('mongoose');

const WebhookSchema = new mongoose.Schema({
  url: String,
  event: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Webhook || mongoose.model('Webhook', WebhookSchema);
