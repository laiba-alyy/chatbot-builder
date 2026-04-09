const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
    index: true
  },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'USD', uppercase: true },
  type: {
    type: String,
    enum: ['subscription', 'one_time', 'refund', 'credit'],
    default: 'subscription'
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded', 'disputed'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: { type: String, enum: ['card', 'bank_transfer', 'paypal', 'crypto', 'stripe_balance'] },
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    funding: String,
    bankName: String
  },
  stripe: {
    paymentIntentId: String,
    chargeId: String,
    customerId: String,
    receiptUrl: String,
    failureCode: String,
    failureMessage: String,
    webhookEvents: [{
      type: String,
      receivedAt: { type: Date, default: Date.now }
    }]
  },
  refund: {
    status: { type: Boolean, default: false },
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundId: String
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  paidAt: Date,
  failedAt: Date,
  refundedAt: Date
}, { timestamps: true });

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ 'stripe.paymentIntentId': 1 }, { unique: true, sparse: true });

// ✅ FIX: async pre-save hook - no next() needed
paymentSchema.pre('save', async function () {
  if (this.status === 'succeeded' && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  if (this.refund?.status && !this.refundedAt) {
    this.refundedAt = new Date();
  }
});

paymentSchema.methods.succeed = function (stripeData) {
  this.status = 'succeeded';
  this.paidAt = new Date();
  if (stripeData) this.stripe = { ...this.stripe, ...stripeData };
  return this.save();
};

paymentSchema.methods.fail = function (errorCode, errorMessage) {
  this.status = 'failed';
  this.failedAt = new Date();
  this.stripe.failureCode = errorCode;
  this.stripe.failureMessage = errorMessage;
  return this.save();
};

// ✅ FIX: Renamed from 'refund' to 'processRefund' to avoid conflict with refund schema field
paymentSchema.methods.processRefund = function (amount, reason, refundId) {
  this.refund = {
    status: true,
    amount: amount || this.amount,
    reason: reason || 'requested_by_customer',
    refundedAt: new Date(),
    refundId
  };
  this.status = 'refunded';
  return this.save();
};

paymentSchema.statics.getTotalRevenue = function (userId) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId), status: 'succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);