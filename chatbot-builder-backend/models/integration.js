const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const integrationSchema = new mongoose.Schema({
  // Ownership
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
    index: true
  },
  // Integration Info
  platform: {
    type: String,
    required: true,
    enum: [
      'website', 'slack', 'discord', 'whatsapp', 'telegram', 'messenger',
      'instagram', 'api', 'shopify', 'salesforce', 'hubspot', 'zendesk',
      'twitter', 'facebook', 'google_sheets', 'wordpress'
    ]
  },
  name: String,
  description: String,
  // Connection Status
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'pending'],
    default: 'disconnected'
  },
  connectedAt: Date,
  lastSync: Date,
  // Configuration
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookUrl: String,
  webhookSecret: String,
  // 🔐 Encrypted credentials (stored as encrypted string)
  credentials: {
    type: String,
    select: false
  },
  permissions: [String],
  scopes: [String],
  // Usage Stats
  usage: {
    messages: { type: Number, default: 0 },
    actions: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
    lastUsed: Date
  },
  error: String,
  lastError: Date
}, {
  timestamps: true
});

// Indexes
integrationSchema.index({ bot: 1, platform: 1 });
integrationSchema.index({ user: 1, status: 1 });

// ✅ FIX: Changed to async function() to avoid next() issue with newer Mongoose
integrationSchema.pre('save', async function () {
  // Auto-set connectedAt when status becomes connected
  if (this.status === 'connected' && !this.connectedAt) {
    this.connectedAt = new Date();
  }

  // Encrypt credentials if modified and not already encrypted
  if (this.isModified('credentials') && this.credentials) {
    if (!this.credentials.startsWith('U2FsdGVk')) {
      this.credentials = encrypt(this.credentials);
    }
  }
});

// Method to get decrypted credentials
integrationSchema.methods.getDecryptedCredentials = function () {
  return decrypt(this.credentials);
};

// Static decrypt helper
integrationSchema.statics.decryptCredentials = function (encryptedCredentials) {
  return decrypt(encryptedCredentials);
};

// Update usage method
integrationSchema.methods.updateUsage = function (type, count = 1) {
  if (!this.usage) this.usage = {};
  if (this.usage[type] !== undefined) {
    this.usage[type] += count;
  }
  this.usage.lastUsed = new Date();
  return this.save();
};

// Error handler
integrationSchema.methods.markError = function (errorMessage) {
  this.status = 'error';
  this.error = errorMessage;
  this.lastError = new Date();
  return this.save();
};

module.exports = mongoose.model('Integration', integrationSchema);