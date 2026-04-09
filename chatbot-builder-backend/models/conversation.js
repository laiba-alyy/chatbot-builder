const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Session Info
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated', 'abandoned'],
    default: 'active'
  },

  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    index: true
  }],

  // User Context
  userName: String,
  userEmail: String,
  userLocation: String,
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'unknown'],
    default: 'unknown'
  },
  language: {
    type: String,
    default: 'en'
  },

  // Stats
  messageCount: { type: Number, default: 0 },
  satisfaction: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  duration: { type: Number, default: 0 },

  // Timestamps
  startedAt: { type: Date, default: Date.now },
  endedAt: Date,
  lastMessageAt: Date

}, {
  timestamps: true
});


// ✅ Virtual should be here
conversationSchema.virtual('messagesVirtual', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  options: { sort: { timestamp: 1 } }
});


// Index for queries
conversationSchema.index({ bot: 1, status: 1 });
conversationSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);