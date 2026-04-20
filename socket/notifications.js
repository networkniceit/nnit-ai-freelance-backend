// socket/notifications.js
// Real-time notifications with Socket.IO
const socketio = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId

function initSocket(server) {
    io = socketio(server, { cors: { origin: '*' } });
    io.on('connection', (socket) => {
        socket.on('register', (userId) => {
            userSockets.set(userId, socket.id);
        });
        socket.on('disconnect', () => {
            for (const [userId, sid] of userSockets.entries()) {
                if (sid === socket.id) userSockets.delete(userId);
            }
        });
    });
}

function sendNotification(userId, notification) {
    const socketId = userSockets.get(userId);
    if (io && socketId) {
        io.to(socketId).emit('notification', notification);
    }
}

module.exports = { initSocket, sendNotification };
