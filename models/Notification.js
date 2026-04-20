// models/Notification.js
// Basic Notification model (plain JS object, not using a database)

class Notification {
  constructor({ id, userId, message, read, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.message = message;
    this.read = read;
    this.createdAt = createdAt;
  }
  // Add methods as needed for your application
}

module.exports = Notification;
