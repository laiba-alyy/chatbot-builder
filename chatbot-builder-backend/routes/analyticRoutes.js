const express = require('express');
const {
  getDashboardOverview,
  getDetailedAnalytics,
  exportAnalytics,
  getRealtimeMetrics
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Dashboard overview
router.get('/overview', getDashboardOverview);

// Detailed analytics with filters
router.get('/detailed', getDetailedAnalytics);

// Export data
router.get('/export', exportAnalytics);

// Real-time metrics (for WebSocket integration)
router.get('/realtime', getRealtimeMetrics);

module.exports = router;