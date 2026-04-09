const User = require('../models/user');
const jwt = require('jsonwebtoken');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

// helper for signing tokens
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  // guard against missing body (e.g. incorrect content-type)
  const { fullName, email, password } = req.body || {};

  if (!fullName || !email || !password) {
    return next(new AppError('Please provide fullName, email and password', 400));
  }

  // Ensure email is not already registered
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError('Email already in use', 400));
  }

  const user = await User.create({ fullName, email, password });
  const token = signToken(user._id);
  res.status(201).json({ success: true, token, data: user });
});

// @desc    Login existing user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid credentials', 401));
  }

  const token = signToken(user._id);
user.password = undefined; // strip password before sending
res.status(200).json({ success: true, token, data: user })
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({ success: true, data: req.user });
});

// @desc    Logout user (dummy endpoint)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out' });
};
