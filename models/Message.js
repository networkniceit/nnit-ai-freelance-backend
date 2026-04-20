// models/Message.js
// Basic Message model (plain JS object, not using a database)

class Message {
  constructor({ id, senderId, receiverId, content, timestamp }) {
    this.id = id;
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.content = content;
    this.timestamp = timestamp;
  }
  // Add methods as needed for your application
}

module.exports = Message;
