// NNIT - Basic Logging System
module.exports = {
  logger: {
    info: (...args) => console.log('[INFO]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
  },
  morganMiddleware: (req, res, next) => next(),
  requestLogger: (req, res, next) => next(),
  errorLogger: (err, req, res, next) => next(),
  successLogger: (req, res, next) => next(),
  dbLogger: {
    connected: (db) => console.log(`[DB CONNECTED] ${db}`),
    disconnected: (db) => console.log(`[DB DISCONNECTED] ${db}`),
    error: (db, err) => console.error(`[DB ERROR] ${db}:`, err),
  },
  healthLogger: {
    status: () => console.log('[HEALTH] Status checked'),
  }
};
