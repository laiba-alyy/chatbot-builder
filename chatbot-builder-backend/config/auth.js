const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Protect routes - Verify JWT token and attach user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Extract token: "Bearer <token>" -> "<token>"
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token payload (decoded.id contains user _id)
    req.user = await User.findById(decoded.id).select('-password');

    // Check if user still exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update last active timestamp (optional, for analytics)
    req.user.stats.lastActive = Date.now();
    await req.user.save({ validateBeforeSave: false });

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Handle token expiration
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired, please login again'
      });
    }
    
    // Handle invalid token
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    // Generic error
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

/**
 * Authorize specific roles - Check if user has required role
 * @param  {...string} roles - Allowed roles (e.g., 'admin', 'owner')
 * @returns {Function} Express middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user role is in allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

/**
 * Optional: Check if user is bot owner or team member
 * @param {string} botIdParam - Name of route param containing bot ID
 */
exports.checkBotAccess = (botIdParam = 'id') => {
  return async (req, res, next) => {
    const Bot = require('../models/bot');
    
    try {
      const bot = await Bot.findById(req.params[botIdParam]);
      
      if (!bot) {
        return res.status(404).json({
          success: false,
          message: 'Bot not found'
        });
      }

      // Check if user is owner or team member
      const isOwner = bot.owner.toString() === req.user.id;
      const isTeamMember = bot.team.some(
        member => member.toString() === req.user.id
      );

      if (!isOwner && !isTeamMember) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this bot'
        });
      }

      // Attach bot to request for controllers to use
      req.bot = bot;
      next();
    } catch (error) {
      next(error);
    }
  };
};