const express = require('express');
const {
  getSubscription,
  getPlans,
  createCheckoutSession,
  handleWebhook,
  getInvoices,
  getInvoice,
  getPaymentMethods,
  updateUsage,
  cancelSubscription,
  resumeSubscription,
  getUsageStats,
  downloadInvoicePdf
} = require('../controllers/billingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public webhook endpoint (no auth, verified via signature)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.use(protect);

// Subscription management
router.get('/subscription', getSubscription);
router.delete('/subscription', cancelSubscription);
router.post('/subscription/resume', resumeSubscription);

// Plans
router.get('/plans', getPlans);

// Checkout
router.post('/checkout', createCheckoutSession);

// Invoices
router.get('/invoices', getInvoices);
router.get('/invoices/:id', getInvoice);
router.get('/invoices/:id/pdf', downloadInvoicePdf);

// Payment methods
router.get('/payment-methods', getPaymentMethods);

// Usage
router.get('/usage', getUsageStats);
router.patch('/usage', updateUsage);

module.exports = router;