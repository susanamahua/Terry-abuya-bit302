// ============================================
// HOPE HAVEN - Express Server + Socket.io
// ============================================
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { sequelize, testConnection } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const homesRoutes = require('./routes/homes');
const childrenRoutes = require('./routes/children');
const donationsRoutes = require('./routes/donations');
const sponsorshipsRoutes = require('./routes/sponsorships');
const welfareRoutes = require('./routes/welfare');
const adminRoutes = require('./routes/admin');

// Initialize Express
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Make io accessible in routes
app.set('io', io);

// ---- Middleware ----
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..')));

// ---- API Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/homes', homesRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/donations', donationsRoutes);
app.use('/api/sponsorships', sponsorshipsRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Hope Haven API is running 🏡', timestamp: new Date().toISOString() });
});

// ---- Socket.io Events ----
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`📌 ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// ---- Error Handling ----
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// ---- Start Server ----
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Sync database (create tables)
    await sequelize.sync({ alter: false });
    console.log('📊 Database tables synced successfully.');

    // Import models to trigger association setup
    require('./models');

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n🏡 ============================================`);
      console.log(`   HOPE HAVEN Server`);
      console.log(`   ============================================`);
      console.log(`   🌐 API:      http://localhost:${PORT}/api`);
      console.log(`   🖥️  Frontend: http://localhost:${PORT}`);
      console.log(`   📊 Health:   http://localhost:${PORT}/api/health`);
      console.log(`   🔌 Socket:   ws://localhost:${PORT}`);
      console.log(`   ============================================\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
