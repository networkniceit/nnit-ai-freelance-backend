// models/AuditLog.js
// Basic AuditLog model (plain JS object, not using a database)

class AuditLog {
  constructor({ id, action, userId, timestamp }) {
    this.id = id;
    this.action = action;
    this.userId = userId;
    this.timestamp = timestamp;
  }
  // Add methods as needed for your application
}

module.exports = AuditLog;
