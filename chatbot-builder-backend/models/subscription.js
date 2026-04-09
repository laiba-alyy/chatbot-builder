const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Ownership
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Plan Info
  plan: {
    type: String,
    enum: ['free', 'starter', 'pro', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing', 'incomplete'],
    default: 'trialing'
  },
  
  // Billing
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  amount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  
  // Stripe Integration
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  
  // Timing
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  trialStart: Date,
  trialEnd: Date,
  canceledAt: Date,
  
  // Usage Limits
  limits: {
    bots: { type: Number, default: 1 },
    conversations: { type: Number, default: 500 },
    teamMembers: { type: Number, default: 1 },
    integrations: { type: Number, default: 0 },
    storage: { type: Number, default: 1 }, // GB
    apiCalls: { type: Number, default: 1000 }
  },
  
  // Current Usage
  usage: {
    bots: { type: Number, default: 0 },
    conversations: { type: Number, default: 0 },
    teamMembers: { type: Number, default: 0 },
    integrations: { type: Number, default: 0 },
    storage: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 }
  },
  
  // Features
  features: {
    customBranding: { type: Boolean, default: false },
    advancedAnalytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    webhooks: { type: Boolean, default: false },
    customModels: { type: Boolean, default: false }
  },
  
  // Cancellation
  cancelAtPeriodEnd: { type: Boolean, default: false },
  cancellationReason: String,
  
  // Timestamps
}, {
  timestamps: true
});

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

// Method to check if plan includes feature
subscriptionSchema.methods.hasFeature = function(feature) {
  return this.features[feature] === true;
};

// Method to check usage limit
subscriptionSchema.methods.isWithinLimit = function(resource, usage) {
  const limit = this.limits[resource];
  if (limit === -1) return true; // unlimited
  return usage <= limit;
};

// Method to update usage
subscriptionSchema.methods.updateUsage = function(resource, value) {
  if (this.usage[resource] !== undefined) {
    this.usage[resource] = value;
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Subscription', subscriptionSchema);