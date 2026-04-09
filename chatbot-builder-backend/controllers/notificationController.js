const Notification = require('../models/notification');
const User = require('../models/user');
const { catchAsync } = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

/**
 * @desc    Get all notifications for authenticated user
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getNotifications = catchAsync(async (req, res, next) => {
  const { 
    category, 
    priority, 
    read, 
    limit = 50, 
    page = 1 
  } = req.query;

  // Build query
  const query = { user: req.user.id };

  if (category && category !== 'all') query.category = category;
  if (priority && priority !== 'all') query.priority = priority;
  if (read !== undefined) query.read = read === 'true';

  // Execute query with pagination
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const count = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ 
    user: req.user.id, 
    read: false 
  });

  res.status(200).json({
    success: true,
    count: notifications.length,
    total: count,
    unread: unreadCount,
    page: Math.ceil(count / limit),
    data: notifications
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const count = await Notification.countDocuments({
    user: req.user.id,
    read: false
  });

  res.status(200).json({
    success: true,
    count
  });
});

/**
 * @desc    Get single notification
 * @route   GET /api/notifications/:id
 * @access  Private
 */
exports.getNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  notification.read = true;
  notification.readAt = new Date();
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/notifications/mark-all-read
 * @access  Private
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const { category } = req.query;

  const query = { 
    user: req.user.id, 
    read: false 
  };

  if (category && category !== 'all') {
    query.category = category;
  }

  await Notification.updateMany(
    query,
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      } 
    }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * @desc    Delete single notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  });
});

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/notifications/delete-all
 * @access  Private
 */
exports.deleteAllNotifications = catchAsync(async (req, res, next) => {
  const { category, read } = req.query;

  const query = { user: req.user.id };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (read !== undefined) {
    query.read = read === 'true';
  }

  await Notification.deleteMany(query);

  res.status(200).json({
    success: true,
    message: 'Notifications deleted successfully'
  });
});

/**
 * @desc    Get notification settings/preferences
 * @route   GET /api/notifications/settings
 * @access  Private
 */
exports.getNotificationSettings = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('notificationSettings preferences');

  res.status(200).json({
    success: true,
    data: {
      notificationSettings: user.notificationSettings,
      preferences: user.preferences
    }
  });
});

/**
 * @desc    Update notification settings
 * @route   PUT /api/notifications/settings
 * @access  Private
 */
exports.updateNotificationSettings = catchAsync(async (req, res, next) => {
  const { 
    emailNotifications,
    pushNotifications,
    desktopNotifications,
    soundEnabled,
    digestEmail,
    botAlerts,
    trainingUpdates,
    integrationUpdates,
    teamUpdates,
    billingAlerts,
    systemUpdates,
    productUpdates,
    quietHoursEnabled,
    quietHoursStart,
    quietHoursEnd
  } = req.body;

  const user = await User.findById(req.user.id);

  // Update notification settings
  if (emailNotifications !== undefined) {
    user.notificationSettings.emailNotifications = emailNotifications;
  }
  if (pushNotifications !== undefined) {
    user.notificationSettings.pushNotifications = pushNotifications;
  }
  if (desktopNotifications !== undefined) {
    user.notificationSettings.desktopNotifications = desktopNotifications;
  }
  if (soundEnabled !== undefined) {
    user.notificationSettings.soundEnabled = soundEnabled;
  }
  if (digestEmail !== undefined) {
    user.notificationSettings.digestEmail = digestEmail;
  }
  if (botAlerts !== undefined) {
    user.notificationSettings.botAlerts = botAlerts;
  }
  if (trainingUpdates !== undefined) {
    user.notificationSettings.trainingUpdates = trainingUpdates;
  }
  if (integrationUpdates !== undefined) {
    user.notificationSettings.integrationUpdates = integrationUpdates;
  }
  if (teamUpdates !== undefined) {
    user.notificationSettings.teamUpdates = teamUpdates;
  }
  if (billingAlerts !== undefined) {
    user.notificationSettings.billingAlerts = billingAlerts;
  }
  if (systemUpdates !== undefined) {
    user.notificationSettings.systemUpdates = systemUpdates;
  }
  if (productUpdates !== undefined) {
    user.notificationSettings.productUpdates = productUpdates;
  }
  if (quietHoursEnabled !== undefined) {
    user.notificationSettings.quietHoursEnabled = quietHoursEnabled;
  }
  if (quietHoursStart !== undefined) {
    user.notificationSettings.quietHoursStart = quietHoursStart;
  }
  if (quietHoursEnd !== undefined) {
    user.notificationSettings.quietHoursEnd = quietHoursEnd;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Notification settings updated successfully',
    data: {
      notificationSettings: user.notificationSettings
    }
  });
});

/**
 * @desc    Get notification categories
 * @route   GET /api/notifications/categories
 * @access  Private
 */
exports.getCategories = catchAsync(async (req, res, next) => {
  const categories = [
    { id: 'all', name: 'All', icon: '🔔', count: 0 },
    { id: 'bot', name: 'Bots', icon: '🤖', count: 0 },
    { id: 'training', name: 'Training', icon: '🧠', count: 0 },
    { id: 'integration', name: 'Integrations', icon: '🔌', count: 0 },
    { id: 'team', name: 'Team', icon: '👥', count: 0 },
    { id: 'billing', name: 'Billing', icon: '💰', count: 0 },
    { id: 'system', name: 'System', icon: '🔧', count: 0 },
    { id: 'product', name: 'Product', icon: '✨', count: 0 },
    { id: 'analytics', name: 'Analytics', icon: '📊', count: 0 },
    { id: 'security', name: 'Security', icon: '🛡️', count: 0 }
  ];

  // Get counts for each category
  const counts = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id), read: false } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  // Update category counts
  categories.forEach(cat => {
    const countData = counts.find(c => c._id === cat.id);
    if (countData) {
      cat.count = countData.count;
    }
  });

  // Set total unread count
  const totalUnread = counts.reduce((sum, c) => sum + c.count, 0);
  categories[0].count = totalUnread;

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

/**
 * @desc    Create notification (internal use - called by services)
 * @route   POST /api/notifications/create (protected by service key)
 * @access  Private (Service)
 */
exports.createNotification = catchAsync(async (req, res, next) => {
  const { 
    userId, 
    type, 
    category, 
    title, 
    message, 
    priority = 'medium',
    action,
    data
  } = req.body;

  // Verify user exists
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check if user wants this type of notification
  const categoryKey = `${category}Updates` || `${category}Alerts`;
  if (user.notificationSettings && user.notificationSettings[categoryKey] === false) {
    // User has disabled this category, skip notification
    return res.status(200).json({
      success: true,
      message: 'Notification skipped (user preference)'
    });
  }

  // Check quiet hours
  if (user.notificationSettings?.quietHoursEnabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = user.notificationSettings.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = user.notificationSettings.quietHoursEnd.split(':').map(Number);
    const quietStart = startHour * 60 + startMinute;
    const quietEnd = endHour * 60 + endMinute;

    // If currently in quiet hours and not high priority, skip
    if (priority !== 'high' && currentTime >= quietStart && currentTime <= quietEnd) {
      return res.status(200).json({
        success: true,
        message: 'Notification skipped (quiet hours)'
      });
    }
  }

  const notification = await Notification.create({
    user: userId,
    type,
    category,
    title,
    message,
    priority,
    action: action || null,
    data: data || {}
  });

  // TODO: Send push notification if enabled
  // if (user.notificationSettings?.pushNotifications) {
  //   await sendPushNotification(userId, notification);
  // }

  // TODO: Send email if enabled
  // if (user.notificationSettings?.emailNotifications) {
  //   await sendEmailNotification(userId, notification);
  // }

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  });
});

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/stats
 * @access  Private
 */
exports.getStats = catchAsync(async (req, res, next) => {
  const stats = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        read: { $sum: { $cond: ['$read', 1, 0] } },
        unread: { $sum: { $cond: ['$read', 0, 1] } }
      }
    }
  ]);

  const categoryStats = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        unread: { $sum: { $cond: ['$read', 0, 1] } }
      }
    }
  ]);

  const priorityStats = await Notification.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(req.user.id) } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      summary: stats[0] || { total: 0, read: 0, unread: 0 },
      byCategory: categoryStats,
      byPriority: priorityStats
    }
  });
});

/**
 * @desc    Export notifications
 * @route   GET /api/notifications/export
 * @access  Private
 */
exports.exportNotifications = catchAsync(async (req, res, next) => {
  const { format = 'csv', startDate, endDate, category } = req.query;

  // Build query
  const query = { user: req.user.id };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(10000);

  if (format === 'csv') {
    // Generate CSV
    const headers = ['Date', 'Type', 'Category', 'Title', 'Message', 'Priority', 'Read'];
    
    const rows = notifications.map(notif => [
      notif.createdAt.toISOString(),
      notif.type,
      notif.category,
      notif.title,
      notif.message.replace(/,/g, ';'), // Escape commas
      notif.priority,
      notif.read ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows].map(row => 
      row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition', 
      `attachment; filename=notifications-${Date.now()}.csv`
    );
    res.send(csvContent);
  } else {
    return next(new AppError('Unsupported export format', 400));
  }
});