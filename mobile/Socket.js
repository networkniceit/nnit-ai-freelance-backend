// mobile/Socket.js
import io from 'socket.io-client';
const SOCKET_URL = 'https://your-api-url.com';
export const socket = io(SOCKET_URL, { transports: ['websocket'] });
