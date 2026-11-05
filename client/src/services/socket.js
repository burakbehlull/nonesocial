import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10
    });

    socket.on('connect', () => {
      console.log('✅ Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
