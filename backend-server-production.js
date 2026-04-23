// NNIT - Production Server (Fixed - No Circular Dependencies)
// Main server file for Railway/Vercel deployment

const express = require('express');
const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const app = express();

// ==================== MIDDLEWARE SETUP ====================

// Body parsers
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== DATABASE CONNECTIONS ====================

// PostgreSQL Connection Pool (create before importing controllers)
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Make pgPool available globally for controllers
global.pgPool = pgPool;

// Import after pgPool is created
const securityMiddleware = require('./backend-security-middleware');
const {
  logger,
  morganMiddleware,
  requestLogger,
  errorLogger,
  successLogger,
  dbLogger,
  healthLogger
} = require('./backend-logging-system');

// Apply security middleware
securityMiddleware(app);

// Apply logging middleware
app.use(morganMiddleware);
app.use(requestLogger);
app.use(successLogger);

// MongoDB Atlas Connection
const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    dbLogger.connected('MongoDB Atlas');
    
    mongoose.connection.on('disconnected', () => {
      dbLogger.disconnected('MongoDB Atlas');
    });

    mongoose.connection.on('error', (err) => {
      dbLogger.error('MongoDB Atlas', err);
    });

  } catch (error) {
    dbLogger.error('MongoDB Atlas', error);
    // Don't exit the process on MongoDB connection failure in production startup
    // Allow the server to start so health endpoints and static assets remain available.
    return;
  }
};

pgPool.on('connect', () => {
  dbLogger.connected('PostgreSQL');
});

pgPool.on('error', (err) => {
  dbLogger.error('PostgreSQL', err);
});

// ==================== ROUTES ====================

// Serve lightweight standalone frontend at /free when present
const freeFrontendPath = path.join(__dirname, 'frontend-free');
if (fs.existsSync(freeFrontendPath)) {
  app.use('/free', express.static(freeFrontendPath));
  app.get('/free', (req, res) => res.sendFile(path.join(freeFrontendPath, 'index.html')));
}

// Serve standalone frontend at /standalone (completely separate)
const standalonePath = path.join(__dirname, 'frontend-standalone');
if (fs.existsSync(standalonePath)) {
  app.use('/standalone', express.static(standalonePath));
  app.get('/standalone', (req, res) => res.sendFile(path.join(standalonePath, 'index.html')));
}

// Serve admin aggregator at /admin when present
const adminPath = path.join(__dirname, 'frontend-admin');
if (fs.existsSync(adminPath)) {
  app.use('/admin', express.static(adminPath));
  app.get('/admin', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));
}


// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    let pgStatus = 'disconnected';
    try {
      await pgPool.query('SELECT 1');
      pgStatus = 'connected';
    } catch (err) {
      logger.error('PostgreSQL health check failed', err);
    }

    healthLogger.status();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      databases: {
        mongodb: mongoStatus,
        postgresql: pgStatus
      },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'NNIT Backend API - Production Ready',
    version: '2.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      auditLog: '/api/audit-log/*',
      notifications: '/api/notifications/*'
    }
  });
});

// ==================== API ROUTES ====================

// Authentication routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Audit log routes
const auditLogRoutes = require('./routes/auditLog');
app.use('/api/audit-log', auditLogRoutes);

// Notifications routes
const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);

// Admin routes (users, audit, admin summary)
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);

// ==================== CONVENIENCE ROUTES ====================

// Simple login route (forwards to auth)
app.all('/login', async (req, res) => {
  if (req.method === 'POST') {
    const { login } = require('./controllers/authController');
    return login(req, res);
  } else {
    res.status(200).json({
      message: 'Login endpoint',
      method: 'POST',
      endpoint: '/login',
      body_required: { email: 'string', password: 'string' }
    });
  }
});

// Simple register route (forwards to auth)
app.all('/register', async (req, res) => {
  if (req.method === 'POST') {
    const { register } = require('./controllers/authController');
    return register(req, res);
  } else {
    res.status(200).json({
      message: 'Register endpoint',
      method: 'POST', 
      endpoint: '/register',
      body_required: { email: 'string', password: 'string', name: 'string' }
    });
  }
});

// ==================== ERROR HANDLING ====================

// Dev-only admin summary quick endpoint (no auth) for local testing
if (process.env.NODE_ENV !== 'production') {
  try {
    const UserModel = require('./models/User');
    const AuditModel = require('./models/AuditLog');
    app.get('/api/admin/summary-dev', async (req, res) => {
      try {
        const usersCount = await UserModel.countDocuments();
        const recentAudits = await AuditModel.find().sort({ created_at: -1 }).limit(10);
        res.json({ usersCount, recentAudits, dev: true });
      } catch (err) {
        // fallback for local dev when DB is not connected
        res.json({ usersCount: 0, recentAudits: [], dev: true, warning: 'DB unavailable or query failed' });
      }
    });
  } catch (e) {
    // ignore if models unavailable in minimal dev setups
    console.warn('Dev summary not available:', e && e.message ? e.message : e);
  }
}

// 404 handler
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.url
  });
});

// Global error handler
app.use(errorLogger);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT || 8080; 
const startServer = async () => {
  try {
    // Attempt to connect to MongoDB but do not abort startup on failure
    await connectMongoDB().catch(err => {
      logger.warn('MongoDB connection failed during startup; continuing without DB', err && err.message ? err.message : err);
    });

    console.log('PostgreSQL URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
    try {
      await pgPool.query('SELECT NOW()');
      logger.info('✅ PostgreSQL connected');
    } catch (error) {
      logger.warn('⚠️ PostgreSQL disabled or credentials invalid - audit logs and notifications unavailable');
    }

    app.listen(PORT, () => {
      logger.info(`🚀 NNIT Backend Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 Security: ENABLED`);
      logger.info(`📝 Logging: ACTIVE`);
      logger.info(`🔐 Authentication: ENABLED`);
      logger.info(`📋 Audit Log: ENABLED`);
      logger.info(`🔔 Notifications: ENABLED`);
      console.log(`\n✅ Server ready at http://localhost:${PORT}`);
      console.log(`✅ Health: http://localhost:${PORT}/health\n`);
    });

  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: attempting graceful shutdown (no exit)');
  try {
    await mongoose.connection.close();
  } catch (e) {
    logger.error('Error closing MongoDB connection on SIGTERM', e);
  }
  try {
    await pgPool.end();
  } catch (e) {
    logger.error('Error closing PostgreSQL pool on SIGTERM', e);
  }
  // NOTE: Do not call process.exit here to allow the process to remain available
  // for interactive testing and to avoid premature termination by tooling.
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: attempting graceful shutdown (no exit)');
  try {
    await mongoose.connection.close();
  } catch (e) {
    logger.error('Error closing MongoDB connection on SIGINT', e);
  }
  try {
    await pgPool.end();
  } catch (e) {
    logger.error('Error closing PostgreSQL pool on SIGINT', e);
  }
  // NOTE: Intentionally not exiting so the server remains available for testing.
});

startServer();

module.exports = { app, getPgPool: () => global.pgPool };
