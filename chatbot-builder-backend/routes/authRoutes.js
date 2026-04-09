const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public endpoints
router.post('/register', register);
router.post('/login', login);

// Protected endpoints
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;
