// models/Certificate.js
// Basic Certificate model (plain JS object, not using a database)

class Certificate {
  constructor({ id, name, issuedTo, issuedAt, expiresAt }) {
    this.id = id;
    this.name = name;
    this.issuedTo = issuedTo;
    this.issuedAt = issuedAt;
    this.expiresAt = expiresAt;
  }
  // Add methods as needed for your application
}

module.exports = Certificate;
