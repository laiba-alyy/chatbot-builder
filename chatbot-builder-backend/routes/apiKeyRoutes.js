const express = require('express');
const {
  getKeys,
  createKey,
  updateKey,
  deleteKey,
  verifyKey
} = require('../controllers/apiKeyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public route - verify a key (used by external services)
router.post('/verify', verifyKey);

// Protected routes
router.use(protect);

router.route('/')
  .get(getKeys)
  .post(createKey);

router.route('/:id')
  .put(updateKey)
  .delete(deleteKey);

module.exports = router;