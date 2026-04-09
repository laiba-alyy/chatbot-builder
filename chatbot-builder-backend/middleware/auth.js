const jwt = require('jsonwebtoken');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/apiError');

// Protect routes - require valid JWT in Authorization header
exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // do not expose internals; give a hint to callers how to fix
    return next(new AppError('Not authorized, token missing. Include an Authorization header: Bearer <token>', 401));
  }

  // verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid token', 401));
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError('User not found', 401));
  }

  req.user = user;
  next();
});

// Restrict to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError(`User role '${req.user?.role}' not authorized`, 403)
      );
    }
    next();
  };
};
