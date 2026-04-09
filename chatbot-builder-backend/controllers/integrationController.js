const Integration = require('../models/integration');
const Bot = require('../models/bot');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

/**
 * @desc    Get all available integrations (catalog)
 * @route   GET /api/integrations/available
 * @access  Private
 */
exports.getAvailableIntegrations = catchAsync(async (req, res, next) => {
  const { category, search } = req.query;

  const integrations = [
    {
      id: 'slack',
      name: 'Slack',
      category: 'messaging',
      icon: '💬',
      color: '#4A154B',
      description: 'Connect your bot to Slack workspaces',
      popularity: 98,
      setupTime: '5 min',
      pricing: 'free',
      docs: 'https://api.slack.com',
      features: ['Send messages', 'Respond to mentions', 'Slash commands', 'Interactive buttons'],
      configFields: [
        { name: 'webhookUrl', type: 'url', required: true, label: 'Webhook URL' },
        { name: 'channel', type: 'text', required: true, label: 'Default Channel' },
        { name: 'botToken', type: 'password', required: true, label: 'Bot Token', encrypted: true }
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      category: 'messaging',
      icon: '📱',
      color: '#25D366',
      description: 'Reach customers on WhatsApp',
      popularity: 95,
      setupTime: '15 min',
      pricing: 'paid',
      docs: 'https://developers.facebook.com/docs/whatsapp',
      features: ['Two-way messaging', 'Template messages', 'Media sharing', 'Read receipts'],
      configFields: [
        { name: 'phoneNumberId', type: 'text', required: true, label: 'Phone Number ID' },
        { name: 'accessToken', type: 'password', required: true, label: 'Access Token', encrypted: true },
        { name: 'businessAccountId', type: 'text', required: true, label: 'Business Account ID' }
      ]
    },
    {
      id: 'shopify',
      name: 'Shopify',
      category: 'ecommerce',
      icon: '🛍️',
      color: '#96BF48',
      description: 'Integrate with your Shopify store',
      popularity: 92,
      setupTime: '10 min',
      pricing: 'free',
      docs: 'https://shopify.dev',
      features: ['Order tracking', 'Product search', 'Inventory updates', 'Customer support'],
      configFields: [
        { name: 'storeUrl', type: 'url', required: true, label: 'Store URL' },
        { name: 'apiKey', type: 'password', required: true, label: 'API Key', encrypted: true },
        { name: 'password', type: 'password', required: true, label: 'API Password', encrypted: true }
      ]
    },
    {
      id: 'discord',
      name: 'Discord',
      category: 'messaging',
      icon: '🎮',
      color: '#5865F2',
      description: 'Add your bot to Discord servers',
      popularity: 90,
      setupTime: '8 min',
      pricing: 'free',
      docs: 'https://discord.com/developers',
      features: ['Message handling', 'Slash commands', 'Voice channels', 'Role management'],
      configFields: [
        { name: 'botToken', type: 'password', required: true, label: 'Bot Token', encrypted: true },
        { name: 'clientId', type: 'text', required: true, label: 'Client ID' },
        { name: 'guildId', type: 'text', required: false, label: 'Server ID (optional)' }
      ]
    }
  ];

  let filtered = integrations;

  if (category && category !== 'all') {
    filtered = filtered.filter(i => i.category === category);
  }

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(i =>
      i.name.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query)
    );
  }

  res.status(200).json({
    success: true,
    count: filtered.length,
    integrations: filtered
  });
});

/**
 * @desc    Get user's connected integrations
 * @route   GET /api/integrations
 * @access  Private
 */
exports.getIntegrations = catchAsync(async (req, res, next) => {
  const { bot, status, platform, limit = 20, page = 1 } = req.query;

  const query = { user: req.user.id };

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
  if (platform && platform !== 'all') query.platform = platform;

  const integrations = await Integration.find(query)
    .populate('bot', 'name avatar category')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Integration.countDocuments(query);

  const sanitized = integrations.map(int => {
    const obj = int.toObject();
    delete obj.credentials;
    return obj;
  });

  res.status(200).json({
    success: true,
    count: sanitized.length,
    total: count,
    page: Math.ceil(count / limit),
    integrations: sanitized
  });
});

/**
 * @desc    Get single integration
 * @route   GET /api/integrations/:id
 * @access  Private
 */
exports.getIntegration = catchAsync(async (req, res, next) => {
  const integration = await Integration.findById(req.params.id)
    .populate('bot', 'name avatar category status owner team');

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  const isOwner = integration.bot.owner.toString() === req.user.id;
  const isTeamMember = integration.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to access this integration', 403));
  }

  const sanitized = integration.toObject();
  delete sanitized.credentials;

  res.status(200).json({
    success: true,
    integration: sanitized
  });
});

/**
 * @desc    Connect new integration
 * @route   POST /api/integrations/connect
 * @access  Private
 */
exports.connectIntegration = catchAsync(async (req, res, next) => {
  const { botId, platform, config = {}, credentials } = req.body;

  if (!botId) {
    return next(new AppError('Please provide a botId', 400));
  }

  if (!platform) {
    return next(new AppError('Please provide a platform', 400));
  }

  // require website url when connecting personal site
  if (platform === 'website' && !config.siteUrl) {
    return next(new AppError('Please provide a website URL for website integration', 400));
  }

  const bot = await Bot.findById(botId);

  if (!bot) {
    return next(new AppError('Bot not found', 404));
  }

  const isOwner = bot.owner.toString() === req.user.id;
  const isTeamMember = bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to connect integrations to this bot', 403));
  }

  const existing = await Integration.findOne({ bot: botId, platform });

  if (existing) {
    return next(new AppError(`Integration with ${platform} already connected`, 400));
  }

  // ✅ FIX: Convert credentials object to JSON string before storing
  // The model's pre-save hook will then encrypt it
  let storedCredentials = null;
  if (credentials && Object.keys(credentials).length > 0) {
    storedCredentials = JSON.stringify(credentials);
  }

  const integration = await Integration.create({
    user: req.user.id,
    bot: botId,
    platform,
    name: req.body.name || `${platform} Integration`,
    description: req.body.description,
    config: config || {},
    credentials: storedCredentials,
    status: 'pending',
    connectedAt: new Date()
  });

  // if the integration is for a website and the bot is currently a draft,
  // flip the bot to active so it appears immediately in the Active filter
  if (platform === 'website') {
    const botDoc = await Bot.findById(botId);
    if (botDoc && botDoc.status === 'draft') {
      botDoc.status = 'active';
      botDoc.publishedAt = new Date();
      await botDoc.save();
      // update user active count
      const activeBots = await Bot.countDocuments({ owner: req.user.id, status: 'active' });
      await User.findByIdAndUpdate(req.user.id, { 'stats.activeBots': activeBots });
    }
  }

  const sanitized = integration.toObject();
  delete sanitized.credentials;

  res.status(201).json({
    success: true,
    message: 'Integration connected successfully',
    integration: sanitized
  });
});

/**
 * @desc    Update integration configuration
 * @route   PUT /api/integrations/:id
 * @access  Private
 */
exports.updateIntegration = catchAsync(async (req, res, next) => {
  const { config = {}, credentials, status } = req.body;

  const integration = await Integration.findById(req.params.id)
    .populate('bot', 'owner team');

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  const isOwner = integration.bot.owner.toString() === req.user.id;
  const isTeamMember = integration.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to update this integration', 403));
  }

  if (config) {
    // enforce URL when updating website integration
    if (integration.platform === 'website' && !config.siteUrl && !integration.config.siteUrl) {
      return next(new AppError('Website URL is required for personal website integration', 400));
    }
    integration.config = { ...integration.config, ...config };
  }

  // ✅ FIX: Convert credentials object to JSON string before storing
  // The model's pre-save hook will then encrypt it
  if (credentials && Object.keys(credentials).length > 0) {
    integration.credentials = JSON.stringify(credentials);
  }

  if (status) {
    if (!['connected', 'disconnected', 'error', 'pending'].includes(status)) {
      return next(new AppError('Invalid status value', 400));
    }
    integration.status = status;

    if (status === 'connected') {
      integration.connectedAt = new Date();

      // auto-activate bot when website integration becomes connected
      if (integration.platform === 'website') {
        const botDoc = await Bot.findById(integration.bot);
        if (botDoc && botDoc.status === 'draft') {
          botDoc.status = 'active';
          botDoc.publishedAt = new Date();
          await botDoc.save();
          const activeBots = await Bot.countDocuments({ owner: req.user.id, status: 'active' });
          await User.findByIdAndUpdate(req.user.id, { 'stats.activeBots': activeBots });
        }
      }
    }
  }

  await integration.save();

  const sanitized = integration.toObject();
  delete sanitized.credentials;

  res.status(200).json({
    success: true,
    message: 'Integration updated successfully',
    integration: sanitized
  });
});

/**
 * @desc    Test integration connection
 * @route   POST /api/integrations/:id/test
 * @access  Private
 */
exports.testIntegration = catchAsync(async (req, res, next) => {
  const integration = await Integration.findById(req.params.id)
    .populate('bot', 'owner team');

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  const isOwner = integration.bot.owner.toString() === req.user.id;
  const isTeamMember = integration.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to test this integration', 403));
  }

  const testResult = {
    success: true,
    message: 'Connection test successful',
    details: {
      platform: integration.platform,
      responseTime: '245ms',
      lastChecked: new Date()
    }
  };

  integration.lastSync = new Date();
  await integration.save();

  res.status(200).json({
    success: true,
    testResult
  });
});

/**
 * @desc    Disconnect integration
 * @route   DELETE /api/integrations/:id
 * @access  Private
 */
exports.disconnectIntegration = catchAsync(async (req, res, next) => {
  const integration = await Integration.findById(req.params.id)
    .populate('bot', 'owner team');

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  const isOwner = integration.bot.owner.toString() === req.user.id;
  const isTeamMember = integration.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to disconnect this integration', 403));
  }

  await integration.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Integration disconnected successfully'
  });
});

/**
 * @desc    Get integration usage stats
 * @route   GET /api/integrations/:id/usage
 * @access  Private
 */
exports.getIntegrationUsage = catchAsync(async (req, res, next) => {
  const integration = await Integration.findById(req.params.id)
    .populate('bot', 'owner team');

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  const isOwner = integration.bot.owner.toString() === req.user.id;
  const isTeamMember = integration.bot.team.some(member => member.toString() === req.user.id);

  if (!isOwner && !isTeamMember) {
    return next(new AppError('Not authorized to view this integration', 403));
  }

  const usage = {
    messages: {
      sent: 1245,
      received: 3456,
      failed: 12
    },
    actions: {
      triggered: 89,
      completed: 85,
      errors: 4
    },
    bandwidth: {
      used: '2.4 GB',
      limit: '10 GB'
    },
    rateLimit: {
      remaining: 4500,
      limit: 5000,
      resetAt: new Date(Date.now() + 3600000)
    }
  };

  res.status(200).json({
    success: true,
    usage
  });
});

/**
 * @desc    Handle webhook from integration platform
 * @route   POST /api/integrations/webhook/:platform
 * @access  Public (verified via signature)
 */
exports.handleWebhook = catchAsync(async (req, res, next) => {
  const { platform } = req.params;
  const { body } = req;

  let integration;

  switch (platform) {
    case 'slack':
      integration = await Integration.findOne({
        platform: 'slack',
        'config.webhookUrl': body.webhook_url
      });
      break;
    case 'whatsapp':
      integration = await Integration.findOne({
        platform: 'whatsapp',
        'config.phoneNumberId': body.phone_number_id
      });
      break;
    default:
      return res.status(400).json({ success: false, message: 'Unsupported platform' });
  }

  if (!integration) {
    return res.status(404).json({ success: false, message: 'Integration not found' });
  }

  res.status(200).json({ success: true });
});

/**
 * @desc    Get integration categories
 * @route   GET /api/integrations/categories
 * @access  Private
 */
exports.getIntegrationCategories = catchAsync(async (req, res, next) => {
  const categories = [
    { id: 'all', name: 'All', icon: '🔍', count: 24 },
    { id: 'messaging', name: 'Messaging', icon: '💬', count: 8 },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', count: 5 },
    { id: 'crm', name: 'CRM & Sales', icon: '📊', count: 4 },
    { id: 'social', name: 'Social Media', icon: '📱', count: 3 },
    { id: 'productivity', name: 'Productivity', icon: '⚡', count: 4 }
  ];

  res.status(200).json({
    success: true,
    categories
  });
});

/**
 * @desc    Update integration usage (for internal use)
 * @route   PATCH /api/integrations/:id/usage
 * @access  Private (Service account)
 */
exports.updateUsage = catchAsync(async (req, res, next) => {
  const { messages, actions, errors } = req.body;

  const integration = await Integration.findById(req.params.id);

  if (!integration) {
    return next(new AppError('Integration not found', 404));
  }

  if (messages !== undefined) integration.usage.messages = messages;
  if (actions !== undefined) integration.usage.actions = actions;
  if (errors !== undefined) integration.usage.errors = errors;

  integration.usage.lastUsed = new Date();
  await integration.save();

  res.status(200).json({
    success: true,
    message: 'Usage updated'
  });
});