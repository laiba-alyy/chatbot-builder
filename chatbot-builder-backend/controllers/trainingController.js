const mongoose = require('mongoose');
const path = require('path');
const TrainingJob = require('../models/trainingJob');
const KnowledgeBase = require('../models/knowledgeBase');
const Bot = require('../models/bot');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

/**
 * @desc    Get all training jobs for authenticated user
 * @route   GET /api/training/jobs
 * @access  Private
 */
exports.getTrainingJobs = catchAsync(async (req, res, next) => {
  const { bot, status, type, limit = 20, page = 1 } = req.query;

  const query = {};

  if (bot && bot !== 'all') {
    const botDoc = await Bot.findById(bot);
    if (!botDoc) {
      return next(new AppError('Bot not found', 404));
    }

    const isOwner = botDoc.owner.toString() === req.user.id;
    const isTeamMember = botDoc.team.some(member => member.toString() === req.user.id);

    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized to access this bot', 403));
    }

    query.bot = bot;
  } else {
    const accessibleBots = await Bot.find({
      $or: [
        { owner: req.user.id },
        { team: req.user.id }
      ]
    }).select('_id');

    query.bot = { $in: accessibleBots.map(b => b._id) };
  }

  if (status && status !== 'all') query.status = status;
  if (type && type !== 'all') query.type = type;

  const jobs = await TrainingJob.find(query)
    .populate('bot', 'name avatar category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await TrainingJob.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total: count,
    page: Math.ceil(count / limit),
    data: jobs
  });
});

/**
 * @desc    Get single training job
 * @route   GET /api/training/jobs/:id
 * @access  Private
 */
exports.getTrainingJob = catchAsync(async (req, res, next) => {
  const job = await TrainingJob.findById(req.params.id)
    .populate('bot', 'name avatar category status owner team');

  if (!job) {
    return next(new AppError('Training job not found', 404));
  }

  const isOwner = job.bot.owner.toString() === req.user.id;
  const isTeamMember = job.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to access this training job', 403));
  }

  res.status(200).json({
    success: true,
    data: job
  });
});

/**
 * @desc    Create new training job
 * @route   POST /api/training/jobs
 * @access  Private
 */
exports.createTrainingJob = catchAsync(async (req, res, next) => {
  const { botId, type = 'full', model = 'GPT-3.5', documents } = req.body;

  if (!botId) {
    return next(new AppError('Please provide a botId', 400));
  }

  const bot = await Bot.findById(botId);

  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }

  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to train this bot', 403));
  }

  if (documents && documents.length > 0) {
    const kbDocs = await KnowledgeBase.find({
      _id: { $in: documents },
      bot: botId,
      status: 'processed'
    });

    if (kbDocs.length !== documents.length) {
      return next(new AppError('Some documents are not ready for training', 400));
    }
  }

  const job = await TrainingJob.create({
    bot: botId,
    type,
    model,
    documents: documents || [],
    documentCount: documents?.length || 0,
    status: 'pending',
    estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000)
  });

  bot.training.lastTrainedAt = new Date();
  bot.training.trainingType = type;
  await bot.save();

  res.status(201).json({
    success: true,
    message: 'Training job created successfully',
    data: job
  });
});

/**
 * @desc    Update training job progress (for workers)
 * @route   PATCH /api/training/jobs/:id/progress
 * @access  Private (Worker only)
 */
exports.updateTrainingProgress = catchAsync(async (req, res, next) => {
  const { progress, phase, error } = req.body;

  const job = await TrainingJob.findById(req.params.id);

  if (!job) {
    return next(new AppError('Training job not found', 404));
  }

  if (progress !== undefined) {
    job.progress = Math.min(100, Math.max(0, progress));
  }

  if (phase) {
    job.currentPhase = phase;
  }

  if (error) {
    job.status = 'failed';
    job.error = error;
    job.completedAt = new Date();
  } else if (job.progress >= 100) {
    job.status = 'completed';
    job.completedAt = new Date();

    if (req.body.accuracy) {
      job.accuracy = req.body.accuracy;
      const bot = await Bot.findById(job.bot);
      bot.training.accuracy = req.body.accuracy;
      await bot.save();
    }
  }

  await job.save();

  res.status(200).json({
    success: true,
    message: 'Training progress updated',
    data: { progress: job.progress, status: job.status }
  });
});

/**
 * @desc    Cancel training job
 * @route   DELETE /api/training/jobs/:id
 * @access  Private
 */
exports.cancelTrainingJob = catchAsync(async (req, res, next) => {
  const job = await TrainingJob.findById(req.params.id);

  if (!job) {
    return next(new AppError('Training job not found', 404));
  }

  const bot = await Bot.findById(job.bot);

  if (!bot) {
    return next(new AppError('Associated bot not found', 404));
  }

  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to cancel this training job', 403));
  }

  if (!['pending', 'in_progress'].includes(job.status)) {
    return next(new AppError('Can only cancel pending or in-progress jobs', 400));
  }

  job.status = 'cancelled';
  job.completedAt = new Date();
  await job.save();

  res.status(200).json({
    success: true,
    message: 'Training job cancelled successfully'
  });
});

/**
 * @desc    Get knowledge base documents for a bot
 * @route   GET /api/training/knowledge-base
 * @access  Private
 */
exports.getKnowledgeBase = catchAsync(async (req, res, next) => {
  const { bot, status, search, limit = 20, page = 1 } = req.query;

  const query = {};

  if (bot && bot !== 'all') {
    const botDoc = await Bot.findById(bot);
    if (!botDoc) {
      return next(new AppError('Bot not found', 404));
    }

    const isOwner = botDoc.owner.toString() === req.user.id;
    const isTeamMember = botDoc.team.some(member => member.toString() === req.user.id);

    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized to access this bot', 403));
    }

    query.bot = bot;
  } else {
    const accessibleBots = await Bot.find({
      $or: [
        { owner: req.user.id },
        { team: req.user.id }
      ]
    }).select('_id');

    query.bot = { $in: accessibleBots.map(b => b._id) };
  }

  if (status && status !== 'all') query.status = status;

  if (search) {
    query.$or = [
      { filename: { $regex: search, $options: 'i' } },
      { originalFilename: { $regex: search, $options: 'i' } }
    ];
  }

  const documents = await KnowledgeBase.find(query)
    .populate('bot', 'name')
    .sort({ uploadedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await KnowledgeBase.countDocuments(query);

  res.status(200).json({
    success: true,
    count: documents.length,
    total: count,
    page: Math.ceil(count / limit),
    data: documents
  });
});

/**
 * @desc    Upload document to knowledge base
 * @route   POST /api/training/knowledge-base/upload
 * @access  Private
 */
exports.uploadKnowledgeBase = catchAsync(async (req, res, next) => {
  const { botId } = req.body;

  const bot = await Bot.findById(botId);

  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }

  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to add documents to this bot', 403));
  }

  if (!req.file) {
    return next(new AppError('Please upload a file', 400));
  }

  const filetype = path.extname(req.file.originalname).toLowerCase().slice(1);

  const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx', 'md', 'json'];
  if (!allowedTypes.includes(filetype)) {
    return next(new AppError(`File type .${filetype} not supported`, 400));
  }

  const filename = req.body.filename || path.basename(
    req.file.originalname,
    path.extname(req.file.originalname)
  );

  const document = await KnowledgeBase.create({
    user: req.user.id,
    bot: botId,
    filename,
    originalFilename: req.file.originalname,
    filetype,
    size: req.file.size,
    mimeType: req.file.mimetype,
    url: req.file.path,
    cloudinaryId: req.file.cloudinaryId || null,
    status: 'pending'
  });

  res.status(201).json({
    success: true,
    message: 'Document uploaded successfully',
    data: document
  });
});

/**
 * @desc    Process uploaded document (for workers)
 * @route   POST /api/training/knowledge-base/:id/process
 * @access  Private (Worker only)
 */
exports.processDocument = catchAsync(async (req, res, next) => {
  const { chunks, accuracy, error } = req.body;

  const document = await KnowledgeBase.findById(req.params.id);

  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  if (error) {
    document.status = 'failed';
    document.error = error;
  } else {
    document.chunks = chunks;
    document.accuracy = accuracy;
    document.status = 'processed';
    document.processedAt = new Date();
  }

  await document.save();

  if (document.status === 'processed') {
    await Bot.findByIdAndUpdate(document.bot, {
      $push: {
        knowledgeBase: {
          documentId: document._id,
          filename: document.filename,
          status: 'processed',
          accuracy: accuracy,
          uploadedAt: document.uploadedAt
        }
      }
    });
  }

  res.status(200).json({
    success: true,
    message: 'Document processing complete',
    data: { status: document.status, accuracy: document.accuracy }
  });
});

/**
 * @desc    Delete knowledge base document
 * @route   DELETE /api/training/knowledge-base/:id
 * @access  Private
 */
exports.deleteKnowledgeBase = catchAsync(async (req, res, next) => {
  const document = await KnowledgeBase.findById(req.params.id);

  if (!document) {
    return next(new AppError('Document not found', 404));
  }

  const bot = await Bot.findById(document.bot);

  if (!bot) {
    return next(new AppError('Associated bot not found', 404));
  }

  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to delete this document', 403));
  }

  await Bot.findByIdAndUpdate(document.bot, {
    $pull: { knowledgeBase: { documentId: document._id } }
  });

  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
});

/**
 * @desc    Get training analytics
 * @route   GET /api/training/analytics
 * @access  Private
 */
exports.getTrainingAnalytics = catchAsync(async (req, res, next) => {
  const { bot, period = '30d' } = req.query;

  const dateFilter = getDateFilter(period);
  const matchQuery = { createdAt: dateFilter };

  if (bot && bot !== 'all') {
    const botDoc = await Bot.findById(bot);
    if (botDoc) {
      const isOwner = botDoc.owner.toString() === req.user.id;
      const isTeamMember = botDoc.team.some(member => member.toString() === req.user.id);

      if (isOwner || isTeamMember) {
        matchQuery.bot = botDoc._id;
      }
    }
  } else {
    const accessibleBots = await Bot.find({
      $or: [
        { owner: req.user.id },
        { team: req.user.id }
      ]
    }).select('_id');

    matchQuery.bot = { $in: accessibleBots.map(b => b._id) };
  }

  const analytics = await TrainingJob.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedJobs: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        avgAccuracy: { $avg: '$accuracy' },
        totalTokens: { $sum: '$tokensUsed' },
        avgDuration: {
          $avg: { $subtract: ['$completedAt', '$startedAt'] }
        }
      }
    }
  ]);

  const dailyStats = await TrainingJob.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        jobs: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const modelDistribution = await TrainingJob.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$model',
        count: { $sum: 1 },
        avgAccuracy: { $avg: '$accuracy' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: analytics[0] || {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        avgAccuracy: 0,
        totalTokens: 0,
        avgDuration: 0
      },
      daily: dailyStats,
      modelDistribution,
      period
    }
  });
});

/**
 * @desc    Get available training models
 * @route   GET /api/training/models
 * @access  Private
 */
exports.getAvailableModels = catchAsync(async (req, res, next) => {
  const models = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      description: 'Most accurate, best for complex reasoning',
      speed: 85,
      accuracy: 98,
      cost: 'high',
      contextWindow: '8K',
      features: ['multilingual', 'code', 'reasoning', 'function-calling']
    },
    {
      id: 'gpt-3.5',
      name: 'GPT-3.5',
      description: 'Balanced performance and cost',
      speed: 95,
      accuracy: 92,
      cost: 'medium',
      contextWindow: '4K',
      features: ['multilingual', 'code', 'reasoning']
    },
    {
      id: 'custom-llm',
      name: 'Custom LLM',
      description: 'Fine-tuned for your specific domain',
      speed: 90,
      accuracy: 94,
      cost: 'custom',
      contextWindow: 'Custom',
      features: ['domain-specific', 'fine-tuned', 'private']
    }
  ];

  res.status(200).json({
    success: true,
    data: models
  });
});

// Helper: Get date filter for analytics
function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case '24h':
      return { $gte: new Date(now - 24 * 60 * 60 * 1000) };
    case '7d':
      return { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    case '30d':
      return { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    case '90d':
      return { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) };
    default:
      return { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
  }
}