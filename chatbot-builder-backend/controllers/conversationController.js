const Conversation = require('../models/conversation');
const Message = require('../models/message');
const Bot = require('../models/bot');
const User = require('../models/user');
// catchAsync exports the wrapper function directly (not as a property)
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');
const mongoose = require('mongoose');

/**
 * @desc    Get all conversations for authenticated user
 * @route   GET /api/conversations
 * @access  Private
 */
exports.getConversations = catchAsync(async (req, res, next) => {
  const { 
    bot, 
    status, 
    search, 
    startDate, 
    endDate, 
    limit = 20, 
    page = 1 
  } = req.query;

  // Build query
  const query = { user: req.user.id };

  if (bot && bot !== 'all') query.bot = bot;
  if (status && status !== 'all') query.status = status;
  
  if (search) {
    query.$or = [
      { userName: { $regex: search, $options: 'i' } },
      { userEmail: { $regex: search, $options: 'i' } }
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // Execute query with pagination
  const conversations = await Conversation.find(query)
    .populate('bot', 'name avatar category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Conversation.countDocuments(query);

  res.status(200).json({
    success: true,
    count: conversations.length,
    total: count,
    page: Math.ceil(count / limit),
    data: conversations
  });
});

/**
 * @desc    Get single conversation with messages
 * @route   GET /api/conversations/:id
 * @access  Private
 */
exports.getConversation = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate('bot', 'name avatar category status')
    .populate('user', 'fullName email avatar');

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user has access (owner of conversation or bot)
  const isOwner = conversation.user._id.toString() === req.user.id;
  
  if (!isOwner) {
    // Check if user has access to the bot
    const bot = await Bot.findById(conversation.bot._id);
    const isBotOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(member => member.toString() === req.user.id);
    
    if (!isBotOwner && !isTeamMember) {
      return next(new AppError('Not authorized to access this conversation', 403));
    }
  }

  // Get messages for this conversation
  const messages = await Message.find({ conversation: conversation._id })
    .sort({ timestamp: 1 });

  res.status(200).json({
    success: true,
    data: {
      conversation,
      messages
    }
  });
});

/**
 * @desc    Create new conversation
 * @route   POST /api/conversations
 * @access  Private
 */
exports.createConversation = catchAsync(async (req, res, next) => {
  const { botId, sessionId, userName, userEmail, device, language } = req.body;

  // Verify bot exists and is active
  const bot = await Bot.findById(botId);
  
  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }

  if (bot.status !== 'active') {
    return next(new AppError('Bot is not active', 400));
  }

  // Check if conversation already exists for this session
  let conversation = await Conversation.findOne({ sessionId });

  if (conversation) {
    return res.status(200).json({
      success: true,
      message: 'Conversation already exists',
      data: conversation
    });
  }

  // Create new conversation
  conversation = await Conversation.create({
    bot: botId,
    user: req.user.id,
    sessionId,
    userName: userName || 'Anonymous',
    userEmail: userEmail || req.user.email,
    device: device || 'unknown',
    language: language || 'en',
    status: 'active',
    startedAt: new Date()
  });

  // Update bot stats
  await Bot.findByIdAndUpdate(botId, {
    $inc: { 'stats.totalConversations': 1, 'stats.activeUsers': 1 },
    'stats.lastConversation': new Date()
  });

  // Update user stats
  await User.findByIdAndUpdate(req.user.id, {
    $inc: { 'stats.totalConversations': 1 }
  });

  res.status(201).json({
    success: true,
    message: 'Conversation created successfully',
    data: conversation
  });
});

/**
 * @desc    Send message in conversation
 * @route   POST /api/conversations/:id/messages
 * @access  Private
 */
exports.sendMessage = catchAsync(async (req, res, next) => {
  const { content, role } = req.body;

  if (!content || !role) {
    return next(new AppError('Please provide content and role', 400));
  }

  if (!['user', 'bot', 'system'].includes(role)) {
    return next(new AppError('Invalid role value', 400));
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Create message
  const message = await Message.create({
    conversation: conversation._id,
    role,
    content,
    sentiment: req.body.sentiment || 'neutral',
    intent: req.body.intent,
    entities: req.body.entities,
    triggeredNode: req.body.triggeredNode,
    confidence: req.body.confidence
  });

  // Update conversation
  conversation.lastMessageAt = new Date();
  if (role === 'user') {
    conversation.status = 'active';
  }
  await conversation.save();

  // Populate message with conversation info
  await message.populate('conversation', 'bot user');

  res.status(201).json({
    success: true,
    message: 'Message sent successfully',
    data: message
  });
});

/**
 * @desc    Update conversation status
 * @route   PATCH /api/conversations/:id/status
 * @access  Private
 */
exports.updateConversationStatus = catchAsync(async (req, res, next) => {
  const { status, satisfaction } = req.body;

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check authorization
  const isOwner = conversation.user.toString() === req.user.id;
  
  if (!isOwner) {
    const bot = await Bot.findById(conversation.bot);
    const isBotOwner = bot.owner.toString() === req.user.id;
    
    if (!isBotOwner) {
      return next(new AppError('Not authorized to update this conversation', 403));
    }
  }

  if (status) {
    if (!['active', 'resolved', 'escalated', 'abandoned'].includes(status)) {
      return next(new AppError('Invalid status value', 400));
    }
    conversation.status = status;
    
    if (status === 'resolved' || status === 'abandoned') {
      conversation.endedAt = new Date();
      conversation.duration = Math.floor(
        (conversation.endedAt - conversation.startedAt) / 1000
      ); // in seconds
    }
  }

  if (satisfaction !== undefined) {
    if (satisfaction < 1 || satisfaction > 5) {
      return next(new AppError('Satisfaction must be between 1 and 5', 400));
    }
    conversation.satisfaction = satisfaction;
  }

  await conversation.save();

  // Update bot stats
  await Bot.findByIdAndUpdate(conversation.bot, {
    'stats.lastConversation': new Date()
  });

  res.status(200).json({
    success: true,
    message: 'Conversation updated successfully',
    data: conversation
  });
});

/**
 * @desc    Get conversation analytics
 * @route   GET /api/conversations/analytics
 * @access  Private
 */
exports.getConversationAnalytics = catchAsync(async (req, res, next) => {
  const { bot, period = '7d', startDate, endDate } = req.query;

  // Build date filter
  let dateFilter = {};
  
  if (startDate && endDate) {
    dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else {
    const now = new Date();
    switch(period) {
      case '24h':
        dateFilter = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
        break;
      case '7d':
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        break;
      case '30d':
        dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
        break;
      case '90d':
        dateFilter = { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) };
        break;
      default:
        dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    }
  }

  // Build match query
  const matchQuery = { 
    user: req.user.id,
    createdAt: dateFilter
  };
  
  if (bot && bot !== 'all') {
    matchQuery.bot = new mongoose.Types.ObjectId(bot);
  }

  // Aggregate conversation data
  const analytics = await Conversation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' },
        avgDuration: { $avg: '$duration' },
        resolved: { 
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } 
        },
        escalated: { 
          $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } 
        },
        active: { 
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } 
        }
      }
    }
  ]);

  // Get daily breakdown for charts
  const dailyStats = await Conversation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        conversations: { $sum: 1 },
        satisfied: { 
          $sum: { $cond: [{ $gte: ['$satisfaction', 4] }, 1, 0] } 
        },
        avgDuration: { $avg: '$duration' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Get status distribution
  const statusDistribution = await Conversation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  // Get top bots by conversations
  const topBots = await Conversation.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$bot',
        conversations: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' }
      }
    },
    { $sort: { conversations: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'bots',
        localField: '_id',
        foreignField: '_id',
        as: 'botInfo'
      }
    },
    { $unwind: '$botInfo' }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: analytics[0] || {
        totalConversations: 0,
        avgSatisfaction: 0,
        avgDuration: 0,
        resolved: 0,
        escalated: 0,
        active: 0
      },
      daily: dailyStats,
      statusDistribution,
      topBots,
      period
    }
  });
});

/**
 * @desc    Export conversations to CSV
 * @route   GET /api/conversations/export
 * @access  Private
 */
exports.exportConversations = catchAsync(async (req, res, next) => {
  const { bot, status, startDate, endDate } = req.query;

  // Build query
  const query = { user: req.user.id };
  
  if (bot && bot !== 'all') query.bot = bot;
  if (status && status !== 'all') query.status = status;
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const conversations = await Conversation.find(query)
    .populate('bot', 'name')
    .sort({ createdAt: -1 });

  // Convert to CSV format
  const csvRows = [];
  csvRows.push([
    'ID',
    'Bot Name',
    'User Name',
    'User Email',
    'Status',
    'Satisfaction',
    'Duration (s)',
    'Messages',
    'Started At',
    'Ended At'
  ]);

  conversations.forEach(conv => {
    csvRows.push([
      conv._id,
      conv.bot?.name || 'N/A',
      conv.userName,
      conv.userEmail,
      conv.status,
      conv.satisfaction || 'N/A',
      conv.duration || 0,
      conv.messageCount,
      conv.startedAt,
      conv.endedAt || 'N/A'
    ]);
  });

  // Create CSV content
  const csvContent = csvRows.map(row => row.join(',')).join('\n');

  // Set headers for download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader(
    'Content-Disposition', 
    `attachment; filename=conversations-${Date.now()}.csv`
  );

  res.status(200).send(csvContent);
});

/**
 * @desc    Delete conversation
 * @route   DELETE /api/conversations/:id
 * @access  Private
 */
exports.deleteConversation = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check authorization (only conversation owner or bot owner can delete)
  const isOwner = conversation.user.toString() === req.user.id;
  
  if (!isOwner) {
    const bot = await Bot.findById(conversation.bot);
    const isBotOwner = bot.owner.toString() === req.user.id;
    
    if (!isBotOwner) {
      return next(new AppError('Not authorized to delete this conversation', 403));
    }
  }

  // Delete associated messages
  await Message.deleteMany({ conversation: conversation._id });

  // Delete conversation
  await conversation.deleteOne();

  // Update bot stats
  await Bot.findByIdAndUpdate(conversation.bot, {
    $inc: { 'stats.totalConversations': -1 }
  });

  res.status(200).json({
    success: true,
    message: 'Conversation deleted successfully'
  });
});

/**
 * @desc    Get conversation messages with pagination
 * @route   GET /api/conversations/:id/messages
 * @access  Private
 */
exports.getMessages = catchAsync(async (req, res, next) => {
  const { limit = 50, page = 1, before, after } = req.query;

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check authorization
  const isOwner = conversation.user.toString() === req.user.id;
  
  if (!isOwner) {
    const bot = await Bot.findById(conversation.bot);
    const isBotOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(member => member.toString() === req.user.id);
    
    if (!isBotOwner && !isTeamMember) {
      return next(new AppError('Not authorized to access these messages', 403));
    }
  }

  // Build query
  const query = { conversation: conversation._id };

  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }
  
  if (after) {
    query.timestamp = { ...query.timestamp, $gt: new Date(after) };
  }

  const messages = await Message.find(query)
    .sort({ timestamp: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Message.countDocuments(query);

  res.status(200).json({
    success: true,
    count: messages.length,
    total: count,
    page: Math.ceil(count / limit),
    data: messages.reverse() // Return in chronological order
  });
});