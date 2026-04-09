const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  // Basic Info
  name: {
    type: String,
    required: [true, 'Bot name is required'],
    trim: true,
    maxlength: [100, 'Bot name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['ecommerce', 'support', 'sales', 'realestate', 'healthcare', 'education', 'hr', 'custom'],
    default: 'custom'
  },
  
  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Bot Configuration
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'training', 'archived'],
    default: 'draft'
  },
  language: { type: String, default: 'en' },
  tone: {
    type: String,
    enum: ['professional', 'friendly', 'casual', 'humorous', 'empathetic', 'enthusiastic'],
    default: 'professional'
  },
  personality: [{
    type: String,
    enum: ['helpful', 'friendly', 'concise', 'detailed', 'patient', 'proactive', 'creative', 'analytical']
  }],
  customPrompt: String,
  
  // Visual Customization
  appearance: {
    primaryColor: { type: String, default: '#40e0d0' },
    secondaryColor: { type: String, default: '#6464ff' },
    avatar: { type: String, default: '🤖' },
    welcomeMessage: { type: String, default: 'Hello! How can I help you today?' },
    placeholder: { type: String, default: 'Type your message...' }
  },
  
  // Flow Builder Data (Nodes & Connections)
  flowData: {
    nodes: [{
      id: String,
      type: { 
        type: String, 
        enum: ['message', 'choice', 'action', 'condition', 'api', 'email', 'delay', 'webhook'] 
      },
      position: { x: Number, y: Number },
      data: mongoose.Schema.Types.Mixed
    }],
    edges: [{
      id: String,
      source: String,
      target: String,
      sourceHandle: String,
      targetHandle: String
    }]
  },
  
  // Knowledge Base
  knowledgeBase: [{
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'KnowledgeBase' },
    filename: String,
    status: { type: String, enum: ['pending', 'processing', 'processed', 'failed'], default: 'pending' },
    accuracy: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Integrations
  integrations: [{
    platform: { 
      type: String, 
      enum: ['website', 'slack', 'discord', 'whatsapp', 'telegram', 'messenger', 'instagram', 'api'] 
    },
    config: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
    connectedAt: Date
  }],
  
  // Training Settings
  training: {
    model: { type: String, enum: ['GPT-4', 'GPT-3.5', 'Custom LLM'], default: 'GPT-3.5' },
    lastTrainedAt: Date,
    trainingType: { type: String, enum: ['full', 'incremental', 'fine-tuning'], default: 'full' },
    accuracy: { type: Number, min: 0, max: 100 }
  },
  
  // Stats (denormalized)
  stats: {
    totalConversations: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    avgSatisfaction: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    lastConversation: Date
  },
  
  // Versioning
  version: { type: String, default: '1.0.0' },
  
  // Timestamps
  publishedAt: Date,
  archivedAt: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for conversations
botSchema.virtual('conversations', {
  ref: 'Conversation',
  localField: '_id',
  foreignField: 'bot'
});

// Virtual for training jobs
botSchema.virtual('trainingJobs', {
  ref: 'TrainingJob',
  localField: '_id',
  foreignField: 'bot',
  options: { sort: { createdAt: -1 } }
});

// Indexes
botSchema.index({ owner: 1, status: 1 });
botSchema.index({ category: 1 });
botSchema.index({ name: 'text', description: 'text' });

// Method to update stats
botSchema.methods.updateStats = async function() {
  const Conversation = mongoose.model('Conversation');
  const stats = await Conversation.aggregate([
    { $match: { bot: this._id } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' },
        avgResponseTime: { $avg: '$duration' },
        lastConversation: { $max: '$createdAt' }
      }
    }
  ]);
  
  if (stats[0]) {
    this.stats.totalConversations = stats[0].totalConversations;
    this.stats.avgSatisfaction = stats[0].avgSatisfaction || 0;
    this.stats.avgResponseTime = stats[0].avgResponseTime || 0;
    this.stats.lastConversation = stats[0].lastConversation;
    await this.save({ validateBeforeSave: false });
  }
};

module.exports = mongoose.model('Bot', botSchema);