const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Bot = require('../models/bot');

const socketHandler = (io) => {
  // ─── Auth Middleware ────────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ─── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.user.email}`);

    // Join user's personal room for private events
    socket.join(`user_${socket.user._id}`);

    // ── Bot Room ──────────────────────────────────────────────────────────────

    // ✅ FIX 7: Verify bot access before joining room
    socket.on('join_bot', async (botId) => {
      try {
        const bot = await Bot.findById(botId);

        if (!bot) {
          socket.emit('error', { message: 'Bot not found' });
          return;
        }

        const isOwner = bot.owner.toString() === socket.user._id.toString();
        const isTeamMember = bot.team.some(
          m => m.toString() === socket.user._id.toString()
        );

        if (!isOwner && !isTeamMember) {
          socket.emit('error', { message: 'Not authorized to access this bot' });
          return;
        }

        socket.join(`bot_${botId}`);
        console.log(`✅ User ${socket.user.email} joined bot_${botId}`);
        socket.emit('joined_bot', { botId });
      } catch (error) {
        socket.emit('error', { message: 'Failed to join bot room' });
      }
    });

    socket.on('leave_bot', (botId) => {
      socket.leave(`bot_${botId}`);
      console.log(`👋 User ${socket.user.email} left bot_${botId}`);
    });

    // ── Bot Preview ───────────────────────────────────────────────────────────
    socket.on('bot_preview_message', (data) => {
      // Broadcast preview message to others in the same bot room
      socket.to(`bot_${data.botId}`).emit('bot_preview_response', data);
    });

    // ── Typing Indicators ─────────────────────────────────────────────────────
    socket.on('typing_start', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_typing', {
        userId: socket.user._id,
        userName: socket.user.fullName
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('user_stopped_typing', {
        userId: socket.user._id
      });
    });

    // ── Disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.user.email}`);
    });
  });

  return io;
};

// ─── Server-Side Emit Helpers ─────────────────────────────────────────────────
// ✅ FIX 6: These are called from backend jobs/controllers, NOT from client sockets
// This prevents clients from faking server events

/**
 * Emit training progress update to a specific user
 * Usage: emitTrainingProgress(io, userId, { jobId, progress, status, phase })
 */
const emitTrainingProgress = (io, userId, data) => {
  io.to(`user_${userId}`).emit('training_update', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit notification to a specific user
 * Usage: emitNotification(io, userId, { title, message, type, category })
 */
const emitNotification = (io, userId, data) => {
  io.to(`user_${userId}`).emit('notification_received', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit bot status update to all users in a bot room
 * Usage: emitBotUpdate(io, botId, { status, message })
 */
const emitBotUpdate = (io, botId, data) => {
  io.to(`bot_${botId}`).emit('bot_updated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Emit conversation update to a specific conversation room
 * Usage: emitConversationUpdate(io, conversationId, { message, status })
 */
const emitConversationUpdate = (io, conversationId, data) => {
  io.to(`conversation_${conversationId}`).emit('conversation_updated', {
    ...data,
    timestamp: new Date().toISOString()
  });
};

module.exports = socketHandler;
module.exports.emitTrainingProgress = emitTrainingProgress;
module.exports.emitNotification = emitNotification;
module.exports.emitBotUpdate = emitBotUpdate;
module.exports.emitConversationUpdate = emitConversationUpdate;