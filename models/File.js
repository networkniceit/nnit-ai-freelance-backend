// models/File.js
// Basic File model (plain JS object, not using a database)

class File {
  constructor({ id, filename, path, mimetype, size, uploadedBy, uploadedAt }) {
    this.id = id;
    this.filename = filename;
    this.path = path;
    this.mimetype = mimetype;
    this.size = size;
    this.uploadedBy = uploadedBy;
    this.uploadedAt = uploadedAt;
  }
  // Add methods as needed for your application
}

module.exports = File;
