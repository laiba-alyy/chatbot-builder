const Bot = require('../models/bot');
const Conversation = require('../models/conversation');
const TrainingJob = require('../models/trainingJob');
const KnowledgeBase = require('../models/knowledgeBase');
const Integration = require('../models/integration');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

// @desc    Get all bots for authenticated user
// @route   GET /api/bots
// @access  Private
exports.getBots = catchAsync(async (req, res, next) => {
  const { status, category, search, limit = 10, page = 1 } = req.query;
  
  // Build query
  const query = { owner: req.user.id };
  
  if (status && status !== 'all') query.status = status;
  if (category && category !== 'all') query.category = category;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Execute query with pagination
  const bots = await Bot.find(query)
    .populate('team', 'fullName avatar email')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const count = await Bot.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: bots.length,
    total: count,
    page: Math.ceil(count / limit),
    data: bots
  });
});

// @desc    Get single bot by ID
// @route   GET /api/bots/:id
// @access  Private
exports.getBot = catchAsync(async (req, res, next) => {
  const bot = await Bot.findById(req.params.id)
    .populate('owner', 'fullName email avatar')
    .populate('team', 'fullName avatar email role');
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Check if user has access (owner or team member)
  const isOwner = bot.owner._id.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => 
    member._id.toString() === req.user.id
  );
  
  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to access this bot', 403));
  }
  
  res.status(200).json({
    success: true,
    data: bot
  });
});

// @desc    Create new bot
// @route   POST /api/bots
// @access  Private
exports.createBot = catchAsync(async (req, res, next) => {
  // Add owner to request body
  req.body.owner = req.user.id;

  // if the client provided a status explicitly honor it, otherwise
  // auto-activate if any platform is selected (website integration assumed)
  if (!req.body.status) {
    if (req.body.platforms && req.body.platforms.length > 0) {
      req.body.status = 'active';
      req.body.publishedAt = new Date();
    } else {
      // keep default defined in schema (draft)
      req.body.status = 'draft';
    }
  }
  
  // Set default values if not provided
  if (!req.body.flowData) {
    req.body.flowData = {
      nodes: [{
        id: 'welcome',
        type: 'message',
        position: { x: 400, y: 100 },
        data: {
          title: 'Welcome Message',
          content: req.body.appearance?.welcomeMessage || 'Hello! How can I help you today?',
          buttons: ['Get Started']
        }
      }],
      edges: []
    };
  }
  
  const bot = await Bot.create(req.body);

  // if a website URL was supplied, create a matching integration record
  if (req.body.websiteUrl) {
    const Integration = require('../models/integration');
    await Integration.create({
      user: req.user.id,
      bot: bot._id,
      platform: 'website',
      name: 'Website Integration',
      description: `Embedded on ${req.body.websiteUrl}`,
      config: { siteUrl: req.body.websiteUrl },
      status: 'connected',
      connectedAt: new Date()
    });
  }

  // Update user stats: only increment activeBots if bot is actually active
  const inc = { 'stats.totalBots': 1 };
  if (bot.status === 'active') inc['stats.activeBots'] = 1;

  await req.user.updateOne({ $inc: inc });
  
  res.status(201).json({
    success: true,
    message: 'Bot created successfully',
    data: bot
  });
});

// @desc    Update bot
// @route   PUT /api/bots/:id
// @access  Private
exports.updateBot = catchAsync(async (req, res, next) => {
  let bot = await Bot.findById(req.params.id);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Make sure user is owner or has edit permissions
  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => 
    member.toString() === req.user.id
  );
  
  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to update this bot', 403));
  }
  
  // Prevent owner change
  if (req.body.owner) delete req.body.owner;
  
  bot = await Bot.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    success: true,
    message: 'Bot updated successfully',
    data: bot
  });
});

// @desc    Update bot flow data (nodes/edges)
// @route   PATCH /api/bots/:id/flow
// @access  Private
exports.updateBotFlow = catchAsync(async (req, res, next) => {
  const { nodes, edges } = req.body;
  
  if (!nodes || !edges) {
    return next(new AppError('Please provide nodes and edges data', 400));
  }
  
  const bot = await Bot.findById(req.params.id);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Check permissions
  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => 
    member.toString() === req.user.id
  );
  
  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to edit this bot', 403));
  }
  
  bot.flowData = { nodes, edges };
  bot.version = req.body.version || bot.version;
  await bot.save();
  
  res.status(200).json({
    success: true,
    message: 'Bot flow updated successfully',
    data: { flowData: bot.flowData, version: bot.version }
  });
});

// @desc    Delete bot (with cascade)
// @route   DELETE /api/bots/:id
// @access  Private (Owner only)
exports.deleteBot = catchAsync(async (req, res, next) => {
  const bot = await Bot.findById(req.params.id);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Only owner can delete
  if (bot.owner.toString() !== req.user.id) {
    return next(new AppError('Only bot owner can delete', 403));
  }
  
  // Cascade delete related data
  await Conversation.deleteMany({ bot: bot._id });
  await TrainingJob.deleteMany({ bot: bot._id });
  await KnowledgeBase.deleteMany({ bot: bot._id });
  await Integration.deleteMany({ bot: bot._id });
  
  // Delete the bot
  await bot.deleteOne();
  
  // Update user stats
  await req.user.updateOne({
    $inc: { 'stats.totalBots': -1, 'stats.activeBots': -1 }
  });
  
  res.status(200).json({
    success: true,
    message: 'Bot deleted successfully'
  });
});

// @desc    Toggle bot status (active/paused)
// @route   PATCH /api/bots/:id/status
// @access  Private
exports.toggleBotStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['active', 'paused', 'draft'].includes(status)) {
    return next(new AppError('Invalid status value', 400));
  }
  
  const bot = await Bot.findById(req.params.id);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Check permissions
  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => 
    member.toString() === req.user.id
  );
  
  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized', 403));
  }
  
  bot.status = status;
  if (status === 'active') {
    bot.publishedAt = new Date();
  }
  await bot.save();
  
  // Update user stats
  const activeBots = await Bot.countDocuments({ 
    owner: req.user.id, 
    status: 'active' 
  });
  await req.user.updateOne({ 'stats.activeBots': activeBots });
  
  res.status(200).json({
    success: true,
    message: `Bot ${status} successfully`,
    data: { status: bot.status, publishedAt: bot.publishedAt }
  });
});

// @desc    Get bot analytics/stats
// @route   GET /api/bots/:id/analytics
// @access  Private
exports.getBotAnalytics = catchAsync(async (req, res, next) => {
  const bot = await Bot.findById(req.params.id);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }
  
  // Check access
  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => 
    member.toString() === req.user.id
  );
  
  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized', 403));
  }
  
  // Aggregate conversation data
  const { period = '7d' } = req.query;
  const dateFilter = getDateFilter(period);
  
  const analytics = await Conversation.aggregate([
    { $match: { bot: bot._id, createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' },
        avgDuration: { $avg: '$duration' },
        uniqueUsers: { $addToSet: '$user' }
      }
    }
  ]);
  
  // Get daily breakdown for charts
  const dailyStats = await Conversation.aggregate([
    { $match: { bot: bot._id, createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        conversations: { $sum: 1 },
        satisfied: { $sum: { $cond: [{ $gte: ['$satisfaction', 4] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      summary: analytics[0] || {
        totalConversations: 0,
        avgSatisfaction: 0,
        avgDuration: 0,
        uniqueUsers: []
      },
      daily: dailyStats,
      bot: {
        name: bot.name,
        status: bot.status,
        category: bot.category
      }
    }
  });
});

// Helper: Get date filter for analytics
function getDateFilter(period) {
  const now = new Date();
  switch(period) {
    case '24h':
      return { $gte: new Date(now - 24 * 60 * 60 * 1000) };
    case '7d':
      return { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    case '30d':
      return { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    case '90d':
      return { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) };
    default:
      return { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
  }
}