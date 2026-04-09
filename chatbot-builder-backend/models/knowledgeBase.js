const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
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
  
  // File Info
  filename: {
    type: String,
    required: true,
    trim: true
  },
  originalFilename: String,
  filetype: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'md', 'json', 'url']
  },
  size: { type: Number, required: true }, // in bytes
  mimeType: String,
  
  // Storage
  url: { type: String, required: true },
  cloudinaryId: String,
  
  // Processing Status
  status: {
    type: String,
    enum: ['pending', 'processing', 'processed', 'failed'],
    default: 'pending'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  
  // Content Metadata
  pages: Number,
  rows: Number,
  wordCount: Number,
  language: { type: String, default: 'en' },
  
  // Processing Results
  chunks: [{
    content: String,
    embedding: [Number],
    metadata: mongoose.Schema.Types.Mixed
  }],
  accuracy: { type: Number, min: 0, max: 100 },
  
  // Error Handling
  error: String,
  errorMessage: String,
  
  // Timestamps
  uploadedAt: { type: Date, default: Date.now },
  processedAt: Date
}, {
  timestamps: true
});

// Indexes
knowledgeBaseSchema.index({ bot: 1, status: 1 });
knowledgeBaseSchema.index({ user: 1, createdAt: -1 });
knowledgeBaseSchema.index({ filename: 'text' });

// Pre-save hook
knowledgeBaseSchema.pre('save', function(next) {
  if (this.status === 'processed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  next();
});

// Method to update processing status
knowledgeBaseSchema.methods.updateStatus = function(status, progress, error) {
  this.status = status;
  if (progress !== undefined) this.progress = progress;
  if (error) this.error = error;
  return this.save();
};

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);