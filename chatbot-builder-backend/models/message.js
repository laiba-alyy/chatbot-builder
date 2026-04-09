const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },

  // Message Content
  role: {
    type: String,
    enum: ['user', 'bot', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },

  // Metadata
  intent: String,
  entities: [String],
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'empathetic'],
    default: 'neutral'
  },

  // Bot Response Context
  triggeredNode: String,
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },

  // Timestamp
  timestamp: { type: Date, default: Date.now }

}, {
  timestamps: true
});


// ✅ Pre-save hook OUTSIDE schema
messageSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Conversation = mongoose.model('Conversation');

    await Conversation.findByIdAndUpdate(this.conversation, {
      $inc: { messageCount: 1 },
      $push: { messages: this._id },
      lastMessageAt: new Date()
    });
  }
  next();
});


// Index for fast retrieval
messageSchema.index({ conversation: 1, timestamp: 1 });

module.exports = mongoose.model('Message', messageSchema);