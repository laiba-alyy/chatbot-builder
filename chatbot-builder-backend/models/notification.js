const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Notification Info
  type: {
    type: String,
    enum: [
      'bot_alert', 'training_complete', 'integration_success', 
      'team_update', 'billing_alert', 'system_update', 
      'bot_error', 'feature_update', 'weekly_report', 'security_alert'
    ],
    required: true
  },
  category: {
    type: String,
    enum: ['bot', 'training', 'integration', 'team', 'billing', 'system', 'product', 'analytics', 'security'],
    required: true
  },
  
  // Content
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Read Status
  read: { type: Boolean, default: false },
  readAt: Date,
  
  // Action
  action: {
    label: String,
    link: String,
    type: { type: String, enum: ['navigate', 'modal', 'external'] }
  },
  
  // Metadata
  icon: String,
  color: String,
  data: mongoose.Schema.Types.Mixed,
  
  // Delivery
  delivered: {
    email: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
    desktop: { type: Boolean, default: false }
  },
  
  // Timestamps
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ type: 1, priority: -1 });

// Pre-save hook
notificationSchema.pre('save', function(next) {
  if (this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ user: userId, read: false });
};

module.exports = mongoose.model('Notification', notificationSchema);