const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  key: {
    type: String,
    unique: true,
    select: false // Don't return key in queries by default
  },
  hash: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'webhooks']
  }],
  expiresAt: Date,
  lastUsedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// ✅ FIX 4 & 5: async pre-save hook + correct condition using this.isNew
apiKeySchema.pre('save', async function () {
  if (this.isNew) {
    const key = `sk_${crypto.randomBytes(32).toString('hex')}`;
    this.key = key;
    this.hash = crypto.createHash('sha256').update(key).digest('hex');
  }
});

// Method to verify key
apiKeySchema.statics.verifyKey = async function (key) {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const apiKey = await this.findOne({ hash, isActive: true }).populate('user');

  if (apiKey) {
    // Check expiry
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      apiKey.isActive = false;
      await apiKey.save();
      return null;
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
    return apiKey;
  }
  return null;
};

module.exports = mongoose.model('ApiKey', apiKeySchema);