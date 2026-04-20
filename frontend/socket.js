// frontend/socket.js
// React hook for real-time notifications with Socket.IO
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useSocketNotifications(userId, onNotification) {
    useEffect(() => {
        const socket = io('/', { transports: ['websocket'] });
        socket.emit('register', userId);
        socket.on('notification', onNotification);
        return () => {
            socket.disconnect();
        };
    }, [userId, onNotification]);
}

// Usage in a React component:
// import { useSocketNotifications } from './socket';
// useSocketNotifications(userId, (notif) => alert(notif.message));
