const express = require('express');
const multer = require('multer');
const {
  getTrainingJobs,
  getTrainingJob,
  createTrainingJob,
  updateTrainingProgress,
  cancelTrainingJob,
  getKnowledgeBase,
  uploadKnowledgeBase,
  processDocument,
  deleteKnowledgeBase,
  getTrainingAnalytics,
  getAvailableModels
} = require('../controllers/trainingController');
const { protect } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// All routes are protected
router.use(protect);

// Training Jobs
router.route('/jobs')
  .get(getTrainingJobs)
  .post(createTrainingJob);

router.route('/jobs/:id')
  .get(getTrainingJob)
  .delete(cancelTrainingJob);

// Training progress (for workers)
router.patch('/jobs/:id/progress', updateTrainingProgress);

// Knowledge Base
router.route('/knowledge-base')
  .get(getKnowledgeBase);

// File upload for knowledge base
router.post('/knowledge-base/upload', 
  uploadMiddleware.single('file'), 
  uploadKnowledgeBase
);

// Document processing (for workers)
router.post('/knowledge-base/:id/process', processDocument);

// Delete document
router.delete('/knowledge-base/:id', deleteKnowledgeBase);

// Analytics & Models
router.get('/analytics', getTrainingAnalytics);
router.get('/models', getAvailableModels);

module.exports = router;