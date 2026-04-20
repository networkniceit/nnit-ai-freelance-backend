// models/ApiKey.js
// Basic ApiKey model (plain JS object, not using a database)

class ApiKey {
  constructor({ id, key, userId, createdAt, expiresAt }) {
    this.id = id;
    this.key = key;
    this.userId = userId;
    this.createdAt = createdAt;
    this.expiresAt = expiresAt;
  }
  // Add methods as needed for your application
}

module.exports = ApiKey;
