const ApiKey = require('../models/ApiKey');
const catchAsync = require('../utils/catchAsync'); // ✅ FIX 1: Fixed import
const AppError = require('../utils/apiError');

// @desc    Get all API keys for user
// @route   GET /api/keys
// @access  Private
exports.getKeys = catchAsync(async (req, res, next) => {
  const keys = await ApiKey.find({ user: req.user.id }).select('-hash');

  res.status(200).json({
    success: true,
    count: keys.length,
    data: keys
  });
});

// @desc    Create new API key
// @route   POST /api/keys
// @access  Private
exports.createKey = catchAsync(async (req, res, next) => {
  const { name, permissions, expiresAt } = req.body;

  if (!name) {
    return next(new AppError('Please provide a name for the API key', 400));
  }

  // Create the key
  const key = await ApiKey.create({
    user: req.user.id,
    name,
    permissions: permissions || ['read'],
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    // ✅ hash is required — set a placeholder, pre-save hook will overwrite
    hash: 'pending'
  });

  // ✅ FIX 2: Re-fetch with +key since key field has select: false
  const keyWithValue = await ApiKey.findById(key._id).select('+key');

  res.status(201).json({
    success: true,
    message: 'Save this key securely. It will not be shown again.',
    data: {
      _id: keyWithValue._id,
      name: keyWithValue.name,
      key: keyWithValue.key, // ✅ Now correctly returns the key
      permissions: keyWithValue.permissions,
      expiresAt: keyWithValue.expiresAt,
      createdAt: keyWithValue.createdAt
    }
  });
});

// @desc    Update API key permissions or status
// @route   PUT /api/keys/:id
// @access  Private
exports.updateKey = catchAsync(async (req, res, next) => {
  const { permissions, isActive } = req.body;

  // ✅ FIX 3: Only update provided fields to avoid corrupting data
  const updates = {};
  if (permissions !== undefined) updates.permissions = permissions;
  if (isActive !== undefined) updates.isActive = isActive;

  if (Object.keys(updates).length === 0) {
    return next(new AppError('Please provide fields to update', 400));
  }

  const key = await ApiKey.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    updates,
    { new: true, runValidators: true }
  ).select('-hash');

  if (!key) {
    return next(new AppError('API key not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'API key updated successfully',
    data: key
  });
});

// @desc    Delete/revoke API key
// @route   DELETE /api/keys/:id
// @access  Private
exports.deleteKey = catchAsync(async (req, res, next) => {
  const key = await ApiKey.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id
  });

  if (!key) {
    return next(new AppError('API key not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'API key revoked successfully'
  });
});

// @desc    Verify an API key (for middleware use)
// @route   POST /api/keys/verify
// @access  Public
exports.verifyKey = catchAsync(async (req, res, next) => {
  const { key } = req.body;

  if (!key) {
    return next(new AppError('Please provide an API key', 400));
  }

  const apiKey = await ApiKey.verifyKey(key);

  if (!apiKey) {
    return next(new AppError('Invalid or expired API key', 401));
  }

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      permissions: apiKey.permissions,
      user: apiKey.user
    }
  });
});