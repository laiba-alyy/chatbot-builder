const Bot = require('../models/bot');
const Conversation = require('../models/conversation');
const Message = require('../models/message');
const TrainingJob = require('../models/trainingJob');
const Integration = require('../models/integration');
// ✅ FIX 7: Removed unused User import
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

/**
 * @desc    Get dashboard overview stats
 * @route   GET /api/analytics/overview
 * @access  Private
 */
exports.getDashboardOverview = catchAsync(async (req, res, next) => {
  const { period = '7d', botId } = req.query;
  const dateFilter = getDateFilter(period);

  // ✅ FIX 4: botQuery now includes team members, not just owners
  let botQuery;
  if (botId && botId !== 'all') {
    const bot = await Bot.findById(botId);
    if (!bot) return next(new AppError('Bot not found', 404));
    const isOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(m => m.toString() === req.user.id);
    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized', 403));
    }
    botQuery = { _id: botId };
  } else {
    botQuery = {
      $or: [{ owner: req.user.id }, { team: req.user.id }]
    };
  }

  const accessibleBots = await Bot.find(botQuery).select('_id');
  const botIds = accessibleBots.map(b => b._id);

  // Aggregate conversation stats
  const conversationStats = await Conversation.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' },
        avgDuration: { $avg: '$duration' },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        escalated: { $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
      }
    }
  ]);

  // Get unique active users
  const activeUsers = await Conversation.distinct('user', {
    bot: { $in: botIds },
    createdAt: dateFilter
  });

  // Get bot performance summary
  const botPerformance = await Bot.aggregate([
    { $match: { _id: { $in: botIds } } },
    {
      $lookup: {
        from: 'conversations',
        let: { botId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bot', '$$botId'] }, createdAt: dateFilter } },
          { $group: { _id: null, count: { $sum: 1 }, avgSat: { $avg: '$satisfaction' } } }
        ],
        as: 'convStats'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        avatar: 1,
        category: 1,
        status: 1,
        conversations: { $arrayElemAt: ['$convStats.count', 0] },
        satisfaction: { $arrayElemAt: ['$convStats.avgSat', 0] }
      }
    },
    { $sort: { conversations: -1 } },
    { $limit: 5 }
  ]);

  // Get recent activity
  const recentActivity = await Conversation.find({ bot: { $in: botIds } })
    .populate('bot', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(10)
    .select('bot userName status satisfaction createdAt');

  // Get training jobs summary
  const trainingStats = await TrainingJob.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: dateFilter } },
    {
      $group: {
        _id: null,
        totalJobs: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        avgAccuracy: { $avg: '$accuracy' }
      }
    }
  ]);

  // Get integration stats
  const integrationStats = await Integration.aggregate([
    { $match: { bot: { $in: botIds } } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalConversations: conversationStats[0]?.totalConversations || 0,
        avgSatisfaction: conversationStats[0]?.avgSatisfaction?.toFixed(1) || 0,
        avgResponseTime: (conversationStats[0]?.avgDuration / 60)?.toFixed(1) || 0,
        activeUsers: activeUsers.length,
        resolvedConversations: conversationStats[0]?.resolved || 0,
        escalatedConversations: conversationStats[0]?.escalated || 0
      },
      botPerformance,
      recentActivity,
      training: {
        totalJobs: trainingStats[0]?.totalJobs || 0,
        completedJobs: trainingStats[0]?.completed || 0,
        avgAccuracy: trainingStats[0]?.avgAccuracy?.toFixed(1) || 0
      },
      integrations: {
        active: integrationStats.find(s => s._id === 'connected')?.count || 0,
        pending: integrationStats.find(s => s._id === 'pending')?.count || 0,
        error: integrationStats.find(s => s._id === 'error')?.count || 0
      },
      period
    }
  });
});

/**
 * @desc    Get detailed analytics with charts data
 * @route   GET /api/analytics/detailed
 * @access  Private
 */
exports.getDetailedAnalytics = catchAsync(async (req, res, next) => {
  const {
    period = '30d',
    botId = 'all',
    metric = 'conversations',
    groupBy = 'day'
  } = req.query;

  const dateFilter = getDateFilter(period);
  const groupFormat = getGroupFormat(groupBy);

  // ✅ FIX 5: botQuery now includes team members, not just owners
  let botQuery;
  if (botId && botId !== 'all') {
    const bot = await Bot.findById(botId);
    if (!bot) return next(new AppError('Bot not found', 404));
    const isOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(m => m.toString() === req.user.id);
    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized', 403));
    }
    botQuery = { _id: botId };
  } else {
    botQuery = {
      $or: [{ owner: req.user.id }, { team: req.user.id }]
    };
  }

  const accessibleBots = await Bot.find(botQuery).select('_id');
  const botIds = accessibleBots.map(b => b._id);

  // Time series data for main metric
  const timeSeriesData = await Conversation.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: dateFilter } },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        count: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' },
        avgDuration: { $avg: '$duration' },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // ✅ FIX 2: Fetch conversation IDs BEFORE aggregate pipelines
  const allConvDocs = await Conversation.find({ bot: { $in: botIds } }).select('_id');
  const allConvIds = allConvDocs.map(c => c._id);

  const filteredConvDocs = await Conversation.find({ bot: { $in: botIds }, createdAt: dateFilter }).select('_id');
  const filteredConvIds = filteredConvDocs.map(c => c._id);

  // Intent distribution
  const intentDistribution = await Message.aggregate([
    {
      $match: {
        conversation: { $in: allConvIds }, // ✅ FIX 2: no await inside pipeline
        intent: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$intent',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Sentiment analysis over time
  const sentimentTrends = await Message.aggregate([
    {
      $match: {
        conversation: { $in: filteredConvIds }, // ✅ FIX 2: no await inside pipeline
        sentiment: { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sentiment: '$sentiment'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  // ✅ FIX 1: $hour takes a date object directly, not a dateToString result
  const hourlyActivity = await Conversation.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: dateFilter } },
    {
      $group: {
        _id: { $hour: '$createdAt' }, // ✅ FIX 1: pass date directly
        count: { $sum: 1 },
        avgSatisfaction: { $avg: '$satisfaction' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Geographic distribution
  const geoDistribution = await Conversation.aggregate([
    {
      $match: {
        bot: { $in: botIds },
        createdAt: dateFilter,
        userLocation: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$userLocation',
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 15 }
  ]);

  // Device breakdown
  const deviceBreakdown = await Conversation.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: dateFilter, device: { $exists: true } } },
    {
      $group: {
        _id: '$device',
        count: { $sum: 1 }
      }
    }
  ]);

  // Top questions
  const topQuestions = await Message.aggregate([
    {
      $match: {
        role: 'user',
        conversation: { $in: filteredConvIds } // ✅ FIX 2: no await inside pipeline
      }
    },
    {
      $group: {
        _id: { $toLower: '$content' },
        count: { $sum: 1 },
        sample: { $first: '$content' }
      }
    },
    { $match: { count: { $gte: 3 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // Bot comparison metrics
  const botComparison = await Bot.aggregate([
    { $match: { _id: { $in: botIds } } },
    {
      $lookup: {
        from: 'conversations',
        let: { botId: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$bot', '$$botId'] }, createdAt: dateFilter } },
          {
            $group: {
              _id: null,
              conversations: { $sum: 1 },
              satisfaction: { $avg: '$satisfaction' },
              duration: { $avg: '$duration' },
              users: { $addToSet: '$user' }
            }
          }
        ],
        as: 'stats'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        avatar: 1,
        category: 1,
        conversations: { $ifNull: [{ $arrayElemAt: ['$stats.conversations', 0] }, 0] },
        satisfaction: { $arrayElemAt: ['$stats.satisfaction', 0] },
        avgDuration: { $arrayElemAt: ['$stats.duration', 0] },
        // ✅ FIX 3: use $cond to safely handle missing stats array
        uniqueUsers: {
          $cond: {
            if: { $gt: [{ $size: '$stats' }, 0] },
            then: { $size: { $arrayElemAt: ['$stats.users', 0] } },
            else: 0
          }
        }
      }
    },
    { $sort: { conversations: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      timeSeries: timeSeriesData.map(d => ({
        date: d._id,
        [metric]: d.count,
        satisfaction: d.avgSatisfaction?.toFixed(1),
        duration: (d.avgDuration / 60)?.toFixed(1),
        uniqueUsers: d.uniqueUsers?.length || 0
      })),
      intentDistribution: intentDistribution.map(d => ({
        name: d._id,
        value: d.count,
        percentage: ((d.count / intentDistribution.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1)
      })),
      sentimentTrends: formatSentimentData(sentimentTrends),
      hourlyActivity: hourlyActivity.map(d => ({
        hour: d._id.toString().padStart(2, '0'),
        conversations: d.count,
        satisfaction: d.avgSatisfaction?.toFixed(1)
      })),
      geoDistribution: geoDistribution.map(d => ({
        location: d._id,
        conversations: d.count,
        uniqueUsers: d.uniqueUsers?.length || 0
      })),
      deviceBreakdown: deviceBreakdown.map(d => ({
        device: d._id,
        count: d.count,
        percentage: ((d.count / deviceBreakdown.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1)
      })),
      topQuestions: topQuestions.map(d => ({
        question: d.sample,
        count: d.count,
        trend: calculateTrend(d.count)
      })),
      botComparison,
      filters: { period, botId, metric, groupBy }
    }
  });
});

/**
 * @desc    Export analytics data
 * @route   GET /api/analytics/export
 * @access  Private
 */
exports.exportAnalytics = catchAsync(async (req, res, next) => {
  const { format = 'csv', period = '30d', botId } = req.query;
  const dateFilter = getDateFilter(period);

  // ✅ FIX 6: Added auth check for botId
  let botQuery;
  if (botId && botId !== 'all') {
    const bot = await Bot.findById(botId);
    if (!bot) return next(new AppError('Bot not found', 404));
    const isOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(m => m.toString() === req.user.id);
    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized', 403));
    }
    botQuery = { _id: botId };
  } else {
    botQuery = {
      $or: [{ owner: req.user.id }, { team: req.user.id }]
    };
  }

  const accessibleBots = await Bot.find(botQuery).select('_id');
  const botIds = accessibleBots.map(b => b._id);

  const conversations = await Conversation.find({
    bot: { $in: botIds },
    createdAt: dateFilter
  })
    .populate('bot', 'name')
    .populate('user', 'fullName email')
    .sort({ createdAt: -1 })
    .limit(10000);

  if (format === 'csv') {
    const headers = [
      'Date', 'Bot', 'User', 'Email', 'Status', 'Satisfaction',
      'Duration (min)', 'Messages', 'Device', 'Location'
    ];

    const rows = conversations.map(conv => [
      conv.createdAt.toISOString(),
      conv.bot?.name || 'Unknown',
      conv.userName,
      conv.userEmail,
      conv.status,
      conv.satisfaction || '',
      (conv.duration / 60)?.toFixed(2) || '',
      conv.messageCount,
      conv.device,
      conv.userLocation || ''
    ]);

    const csvContent = [headers, ...rows].map(row =>
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=analytics-export-${Date.now()}.csv`
    );
    res.send(csvContent);
  } else if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=analytics-export-${Date.now()}.json`
    );
    res.json({ success: true, data: conversations });
  } else {
    return next(new AppError('Unsupported export format', 400));
  }
});

/**
 * @desc    Get real-time metrics
 * @route   GET /api/analytics/realtime
 * @access  Private
 */
exports.getRealtimeMetrics = catchAsync(async (req, res, next) => {
  const { botId } = req.query;

  // ✅ FIX 4: Consistent botQuery with team member support
  let botQuery;
  if (botId && botId !== 'all') {
    const bot = await Bot.findById(botId);
    if (!bot) return next(new AppError('Bot not found', 404));
    const isOwner = bot.owner.toString() === req.user.id;
    const isTeamMember = bot.team.some(m => m.toString() === req.user.id);
    if (!isOwner && !isTeamMember) {
      return next(new AppError('Not authorized', 403));
    }
    botQuery = { _id: botId };
  } else {
    botQuery = {
      $or: [{ owner: req.user.id }, { team: req.user.id }]
    };
  }

  const accessibleBots = await Bot.find(botQuery).select('_id');
  const botIds = accessibleBots.map(b => b._id);

  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

  const realtime = await Conversation.aggregate([
    { $match: { bot: { $in: botIds }, createdAt: { $gte: fiveMinAgo } } },
    {
      $group: {
        _id: null,
        activeConversations: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        messagesLast5Min: { $sum: '$messageCount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      activeConversations: realtime[0]?.activeConversations || 0,
      messagesLast5Min: realtime[0]?.messagesLast5Min || 0,
      timestamp: new Date().toISOString()
    }
  });
});

// ─── Helper Functions ────────────────────────────────────────────────────────

function getDateFilter(period) {
  const now = new Date();
  switch (period) {
    case '24h': return { $gte: new Date(now - 24 * 60 * 60 * 1000) };
    case '7d':  return { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
    case '30d': return { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
    case '90d': return { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) };
    case '12m': return { $gte: new Date(now - 365 * 24 * 60 * 60 * 1000) };
    default:    return { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
  }
}

function getGroupFormat(groupBy) {
  switch (groupBy) {
    case 'hour':  return '%Y-%m-%d %H:00';
    case 'day':   return '%Y-%m-%d';
    case 'week':  return '%Y-W%W';
    case 'month': return '%Y-%m';
    default:      return '%Y-%m-%d';
  }
}

function formatSentimentData(rawData) {
  const dates = [...new Set(rawData.map(d => d._id.date))];
  return dates.map(date => {
    const dayData = rawData.filter(d => d._id.date === date);
    return {
      date,
      positive:   dayData.find(d => d._id.sentiment === 'positive')?.count || 0,
      neutral:    dayData.find(d => d._id.sentiment === 'neutral')?.count || 0,
      negative:   dayData.find(d => d._id.sentiment === 'negative')?.count || 0,
      empathetic: dayData.find(d => d._id.sentiment === 'empathetic')?.count || 0
    };
  });
}

function calculateTrend(count) {
  if (count > 20) return '+15%';
  if (count > 10) return '+5%';
  if (count > 5)  return '0%';
  return '-3%';
}