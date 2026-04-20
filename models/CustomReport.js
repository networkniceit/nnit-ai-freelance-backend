// models/CustomReport.js
// Basic CustomReport model (plain JS object, not using a database)

class CustomReport {
  constructor({ id, name, data, createdBy, createdAt }) {
    this.id = id;
    this.name = name;
    this.data = data;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
  }
  // Add methods as needed for your application
}

module.exports = CustomReport;
