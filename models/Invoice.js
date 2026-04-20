const mongoose = require('mongoose');
const { Schema } = mongoose;

const InvoiceSchema = new Schema({
  invoiceId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['paid','unpaid','overdue'], default: 'unpaid' },
  dueDate: { type: Date },
  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
