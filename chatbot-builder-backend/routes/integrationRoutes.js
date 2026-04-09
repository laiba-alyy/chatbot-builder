const express = require('express');
const {
  getAvailableIntegrations,
  getIntegrations,
  getIntegration,
  connectIntegration,
  updateIntegration,
  testIntegration,
  disconnectIntegration,
  getIntegrationUsage,
  handleWebhook,
  getIntegrationCategories,
  updateUsage
} = require('../controllers/integrationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// public webhook endpoint (no auth middleware)
router.post('/webhook/:platform', handleWebhook);

// all other integration routes require authentication
router.use(protect);

router.get('/available', getAvailableIntegrations);
router.get('/categories', getIntegrationCategories);
router.post('/connect', connectIntegration);

// list integrations (and potentially could add more verbs later)
router.route('/')
  .get(getIntegrations);

// operations on a single integration
router.route('/:id')
  .get(getIntegration)
  .put(updateIntegration)
  .delete(disconnectIntegration);

router.post('/:id/test', testIntegration);
router.get('/:id/usage', getIntegrationUsage);
router.patch('/:id/usage', updateUsage);

module.exports = router;
