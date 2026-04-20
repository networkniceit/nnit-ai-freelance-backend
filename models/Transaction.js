const mongoose = require('mongoose');
const { Schema } = mongoose;

const TransactionSchema = new Schema({
  txId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  type: { type: String, enum: ['credit','debit','refund'], default: 'credit' },
  date: { type: Date, default: Date.now },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
