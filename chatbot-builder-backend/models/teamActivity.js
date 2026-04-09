const mongoose = require('mongoose');

const teamActivitySchema = new mongoose.Schema({
  // Context
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Activity Info
  action: {
    type: String,
    required: true,
    enum: [
      'member_invited', 'member_joined', 'member_removed', 'role_changed',
      'bot_created', 'bot_updated', 'bot_deleted', 'bot_published',
      'training_started', 'training_completed', 'training_failed',
      'integration_added', 'integration_updated', 'integration_removed',
      'settings_updated', 'billing_updated', 'subscription_changed'
    ]
  },
  
  // Details
  entityType: {
    type: String,
    enum: ['user', 'bot', 'integration', 'training', 'subscription', 'settings']
  },
  entityId: mongoose.Schema.Types.ObjectId,
  entityName: String,
  
  // Changes
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  description: String,
  ipAddress: String,
  userAgent: String,
  
  // Timestamps
}, {
  timestamps: true
});

// Indexes
teamActivitySchema.index({ team: 1, createdAt: -1 });
teamActivitySchema.index({ user: 1, createdAt: -1 });
teamActivitySchema.index({ entityType: 1, entityId: 1 });

// Static method to get activity for entity
teamActivitySchema.statics.getByEntity = function(entityType, entityId, limit = 50) {
  return this.find({ entityType, entityId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'fullName avatar');
};

module.exports = mongoose.model('TeamActivity', teamActivitySchema);