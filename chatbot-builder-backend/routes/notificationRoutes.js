const express = require('express');
const {
  getNotifications,
  getUnreadCount,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  getCategories,
  createNotification,
  getStats,
  exportNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get notifications
router.route('/')
  .get(getNotifications);

// Notification count
router.get('/unread-count', getUnreadCount);

// Notification stats
router.get('/stats', getStats);

// Categories
router.get('/categories', getCategories);

// Settings
router.route('/settings')
  .get(getNotificationSettings)
  .put(updateNotificationSettings);

// Export
router.get('/export', exportNotifications);

// Mark all as read
router.patch('/mark-all-read', markAllAsRead);

// Delete all
router.delete('/delete-all', deleteAllNotifications);

// Create notification (internal service use)
router.post('/create', createNotification);

// Single notification routes
router.route('/:id')
  .get(getNotification)
  .delete(deleteNotification);

// Mark as read
router.patch('/:id/read', markAsRead);

module.exports = router;