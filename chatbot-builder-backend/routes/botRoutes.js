const express = require('express');
const {
  getBots,
  getBot,
  createBot,
  updateBot,
  updateBotFlow,
  deleteBot,
  toggleBotStatus,
  getBotAnalytics
} = require('../controllers/botController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all bots for user
router.route('/')
  .get(getBots)
  .post(createBot);

// Bot-specific routes
router.route('/:id')
  .get(getBot)
  .put(updateBot)
  .delete(deleteBot);

// Specialized bot routes
router.patch('/:id/flow', updateBotFlow);
router.patch('/:id/status', toggleBotStatus);
router.get('/:id/analytics', getBotAnalytics);

module.exports = router;