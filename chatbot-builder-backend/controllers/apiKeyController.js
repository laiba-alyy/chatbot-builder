const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

// NOTE: The API key feature is currently a stub.  There is no persistent
// storage or model for keys yet.  These handlers simply return placeholders
// so that the routes can be registered without crashing the server.  Implement
// real logic once a schema and storage strategy are added.

exports.getKeys = catchAsync(async (req, res, next) => {
  // TODO: replace with database retrieval
  res.status(200).json({ success: true, keys: [] });
});

exports.createKey = catchAsync(async (req, res, next) => {
  // Validate request body if necessary
  const { name, permissions } = req.body;
  if (!name) {
    return next(new AppError('Key name is required', 400));
  }

  // TODO: actually create and persist a key
  const key = {
    id: 'stub',
    name,
    permissions: permissions || []
  };

  res.status(201).json({ success: true, key });
});

exports.updateKey = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // TODO: look up key by id and update

  res.status(200).json({ success: true, key: { id } });
});

exports.deleteKey = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // TODO: remove key from store

  res.status(200).json({ success: true, message: 'Key deleted' });
});

// External systems call this to verify a key without authentication
exports.verifyKey = catchAsync(async (req, res, next) => {
  const { key } = req.body;
  if (!key) {
    return next(new AppError('API key not provided', 400));
  }

  // TODO: check key validity
  const valid = false;

  res.status(200).json({ success: true, valid });
});
