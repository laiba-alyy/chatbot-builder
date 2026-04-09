const express = require('express');
const {
  getConversations,
  getConversation,
  createConversation,
  sendMessage,
  updateConversationStatus,
  getConversationAnalytics,
  exportConversations,
  deleteConversation,
  getMessages
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all conversations for user
router.route('/')
  .get(getConversations)
  .post(createConversation);

// Export conversations
router.get('/export', exportConversations);

// Get conversation analytics
router.get('/analytics', getConversationAnalytics);

// Conversation-specific routes
router.route('/:id')
  .get(getConversation)
  .delete(deleteConversation);

// Get messages for a conversation
router.get('/:id/messages', getMessages);

// Send message in conversation
router.post('/:id/messages', sendMessage);

// Update conversation status
router.patch('/:id/status', updateConversationStatus);

module.exports = router;