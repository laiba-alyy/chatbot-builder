const mongoose = require('mongoose');

const trainingJobSchema = new mongoose.Schema({
  bot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
    index: true
  },
  
  // Job Info
  type: {
    type: String,
    enum: ['full', 'incremental', 'fine-tuning'],
    default: 'full'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  currentPhase: String,
  
  // Data Sources
  documents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  }],
  documentCount: { type: Number, default: 0 },
  tokensUsed: { type: Number, default: 0 },
  
  // Model Info
  model: { type: String, enum: ['GPT-4', 'GPT-3.5', 'Custom LLM'], default: 'GPT-3.5' },
  accuracy: { type: Number, min: 0, max: 100 },
  version: String,
  
  // Timing
  startedAt: Date,
  completedAt: Date,
  estimatedCompletion: Date,
  
  // Error Handling
  error: String,
  errorMessage: String,
  
  // Results
  results: {
    trainingTime: Number,
    validationAccuracy: Number,
    testAccuracy: Number,
    improvements: [String]
  }
}, {
  timestamps: true
});

// Indexes
trainingJobSchema.index({ bot: 1, createdAt: -1 });
trainingJobSchema.index({ status: 1 });

// Pre-save hook
trainingJobSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'in_progress') {
    this.startedAt = new Date();
  }
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
});

// Method to update progress
trainingJobSchema.methods.updateProgress = function(progress, phase) {
  this.progress = progress;
  if (phase) this.currentPhase = phase;
  return this.save();
};

// Method to mark as failed
trainingJobSchema.methods.fail = function(errorMessage) {
  this.status = 'failed';
  this.error = errorMessage;
  this.completedAt = new Date();
  return this.save();
};

// Method to mark as completed
trainingJobSchema.methods.complete = function(results) {
  this.status = 'completed';
  this.progress = 100;
  if (results) {
    this.accuracy = results.accuracy;
    this.results = results;
  }
  this.completedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('TrainingJob', trainingJobSchema);