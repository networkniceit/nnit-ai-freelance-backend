// models/Organization.js
// Basic Organization model (plain JS object, not using a database)

class Organization {
  constructor({ id, name, ownerId, createdAt }) {
    this.id = id;
    this.name = name;
    this.ownerId = ownerId;
    this.createdAt = createdAt;
  }
  // Add methods as needed for your application
}

module.exports = Organization;
