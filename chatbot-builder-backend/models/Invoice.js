const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  invoiceNumber: { type: String, required: true, unique: true },
  description: String,
  amount: { type: Number, required: true },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  stripeInvoiceId: String,
  stripePaymentIntentId: String,
  status: {
    type: String,
    enum: ['draft', 'open', 'paid', 'uncollectible', 'void'],
    default: 'draft'
  },
  periodStart: Date,
  periodEnd: Date,
  lineItems: [{
    description: String,
    amount: Number,
    quantity: { type: Number, default: 1 },
    unitAmount: Number
  }],
  paid: { type: Boolean, default: false },
  paidAt: Date,
  paymentMethod: {
    type: String,
    enum: ['card', 'bank_transfer', 'paypal', 'crypto']
  },
  pdfUrl: String
}, { timestamps: true });

// Indexes
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });

// ✅ FIX: async pre-save hook - no next() needed
invoiceSchema.pre('save', async function () {
  if (this.paid && !this.paidAt) {
    this.paidAt = new Date();
  }
});

module.exports = mongoose.model('Invoice', invoiceSchema);