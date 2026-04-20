// utils/logger.js
// Simple structured logger for info/error, ready for external integration

module.exports = {
  info(message, meta) {
    console.log(JSON.stringify({ level: 'info', message, ...meta, timestamp: new Date().toISOString() }));
  },
  error(message, meta) {
    console.error(JSON.stringify({ level: 'error', message, ...meta, timestamp: new Date().toISOString() }));
  },
};
