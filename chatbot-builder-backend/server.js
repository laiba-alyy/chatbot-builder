const express = require('express');
const http = require('http');           // ✅ NEW: needed for Socket.io
const { Server } = require('socket.io'); // ✅ NEW: Socket.io
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Load environment variables FIRST
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/authRoutes');
const botRoutes = require('./routes/botRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const TrainingRoutes = require('./routes/trainingRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const analyticsRoutes = require('./routes/analyticRoutes'); // corrected filename
const billingRoutes = require('./routes/billingRoutes');
const teamRoutes = require('./routes/teamRoutes');
const apiKeyRoutes = require('./routes/apiKeyRoutes'); // ✅ NEW
// const notificationRoutes = require('./routes/notificationRoutes'); // skipped for now

// Connect to Database
connectDB();

// ─── App & Server Setup ───────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app); // ✅ NEW: wrap app in http server

// ─── Socket.io Setup ─────────────────────────────────────────────────────────
const io = new Server(server, {        // ✅ NEW
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const socketHandler = require('./sockets/socketHandler'); // ✅ NEW
socketHandler(io);

// Make io accessible in controllers via req.io
app.use((req, res, next) => {          // ✅ NEW
  req.io = io;
  next();
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ✅ Stripe webhook needs raw body — register BEFORE express.json()
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Basic Routes ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Chatbot Builder API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authRoutes);
app.use('/api/bots',          botRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/training',      TrainingRoutes);
app.use('/api/integrations',  integrationRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/billing',       billingRoutes);
app.use('/api/team',          teamRoutes);
app.use('/api/keys',          apiKeyRoutes); // ✅ NEW
// app.use('/api/notifications', notificationRoutes);

// ─── Debug: list registered training routes ───────────────────────────────────
if (TrainingRoutes && TrainingRoutes.stack) {
  console.log('Training routes:');
  TrainingRoutes.stack.forEach(layer => {
    if (layer.route && layer.route.path) {
      console.log('  ', layer.route.path);
    }
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// ─── Process Error Handlers ───────────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.stack);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

// ✅ IMPORTANT: use server.listen not app.listen (required for Socket.io)
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 Socket.io enabled`);
});