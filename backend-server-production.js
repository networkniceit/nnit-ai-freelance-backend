// NNIT - Production Server (Fixed - No Circular Dependencies)
// Main server file for Railway/Vercel deployment

const express = require('express');
const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const app = express();
const helmet = require('helmet');
app.use(helmet({ contentSecurityPolicy: false }));
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;");
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});
app.use((req, res, next) => { res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"); next(); });

const cors = require('cors');
app.use(cors({
  origin: ['https://nnit.shop', 'https://nnit-shop.vercel.app', 'http://localhost:3000', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Body parsers
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== DATABASE CONNECTIONS ====================
const pgPool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

global.pgPool = pgPool;

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

securityMiddleware(app);
app.use(morganMiddleware);
app.use(requestLogger);
app.use(successLogger);

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) throw new Error('MONGODB_URI is not defined in environment variables');
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    dbLogger.connected('MongoDB Atlas');
    mongoose.connection.on('disconnected', () => dbLogger.disconnected('MongoDB Atlas'));
    mongoose.connection.on('error', (err) => dbLogger.error('MongoDB Atlas', err));
  } catch (error) {
    dbLogger.error('MongoDB Atlas', error);
    return;
  }
};

pgPool.on('connect', () => dbLogger.connected('PostgreSQL'));
pgPool.on('error', (err) => dbLogger.error('PostgreSQL', err));

// ==================== STATIC FRONTENDS ====================

const freeFrontendPath = path.join(__dirname, 'frontend-free');
if (fs.existsSync(freeFrontendPath)) {
  app.use('/free', express.static(freeFrontendPath));
  app.get('/free', (req, res) => res.sendFile(path.join(freeFrontendPath, 'index.html')));
}

const standalonePath = path.join(__dirname, 'frontend-standalone');
if (fs.existsSync(standalonePath)) {
  app.use('/standalone', (req, res, next) => {
    res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;");
    next();
  }, express.static(standalonePath));
}

const adminPath = path.join(__dirname, 'frontend-admin');
if (fs.existsSync(adminPath)) {
  app.use('/admin', express.static(adminPath));
  app.get('/admin', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));
}

// ==================== HEALTH ====================

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
      databases: { mongodb: mongoStatus, postgresql: pgStatus },
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// ==================== AI CHAT ROUTE ====================

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4', messages, max_tokens: 1800, temperature: 0.7 })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logger.error('OpenAI API error', err);
      return res.status(response.status).json({ error: err?.error?.message || 'OpenAI error' });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    logger.error('AI chat error', error);
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/legal-ai', async (req, res) => {
  try {
    const { messages, message, prompt } = req.body;
    const msgs = messages || [{ role: 'user', content: message || prompt }];
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${process.env.OPENAI_API_KEY}
      },
      body: JSON.stringify({ model: 'gpt-4', messages: msgs, max_tokens: 1800, temperature: 0.7 })
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ==================== API ROUTES ====================

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);
const jobsRoutes = require('./routes/jobs');
app.use('/api/jobs', jobsRoutes);
const paymentsRoutes = require('./routes/payments');
app.use('/api/payments', paymentsRoutes);
const auditLogRoutes = require('./routes/auditLog');
app.use('/api/audit-log', auditLogRoutes);
const notificationsRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationsRoutes);
const adminRoutes = require('./routes/admin');
app.use('/', adminRoutes);


const productsRoutes = require('./routes/products');
app.use('/api/products', productsRoutes);
// ==================== CONVENIENCE ROUTES ====================

app.all('/login', async (req, res) => {
  if (req.method === 'POST') {
    const { login } = require('./controllers/authController');
    return login(req, res);
  }
  res.status(200).json({ message: 'Login endpoint', method: 'POST', endpoint: '/login', body_required: { email: 'string', password: 'string' } });
});

app.all('/register', async (req, res) => {
  if (req.method === 'POST') {
    const { register } = require('./controllers/authController');
    return register(req, res);
  }
  res.status(200).json({ message: 'Register endpoint', method: 'POST', endpoint: '/register', body_required: { email: 'string', password: 'string', name: 'string' } });
});

// ==================== DEV ONLY ====================

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
        res.json({ usersCount: 0, recentAudits: [], dev: true, warning: 'DB unavailable' });
      }
    });
  } catch (e) {
    console.warn('Dev summary not available:', e && e.message ? e.message : e);
  }
}

// ==================== ROOT — SERVE LEGAL AI FRONTEND ====================

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      message: 'NNIT Backend API - Production Ready',
      version: '2.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        auth: '/api/auth/*',
        auditLog: '/api/audit-log/*',
        notifications: '/api/notifications/*',
        aiChat: '/api/ai/chat'
      }
    });
  }
});

// ==================== ERROR HANDLING ====================

app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, message: 'Route not found', path: req.url });
});

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
    await connectMongoDB().catch(err => {
      logger.warn('MongoDB connection failed during startup; continuing without DB', err && err.message ? err.message : err);
    });

    console.log('PostgreSQL URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
    try {
      await pgPool.query('SELECT NOW()');
      logger.info('✅ PostgreSQL connected');
    } catch (error) {
      logger.warn('⚠️ PostgreSQL connection failed: ' + error.message);
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

process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: attempting graceful shutdown (no exit)');
  try { await mongoose.connection.close(); } catch (e) { logger.error('Error closing MongoDB on SIGTERM', e); }
  try { await pgPool.end(); } catch (e) { logger.error('Error closing PostgreSQL on SIGTERM', e); }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: attempting graceful shutdown (no exit)');
  try { await mongoose.connection.close(); } catch (e) { logger.error('Error closing MongoDB on SIGINT', e); }
  try { await pgPool.end(); } catch (e) { logger.error('Error closing PostgreSQL on SIGINT', e); }
});

startServer();

module.exports = { app, getPgPool: () => global.pgPool }; 




