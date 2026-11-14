import { io } from 'socket.io-client';

// Fallback ile server URL
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    // Get or generate auth token
    let authToken = localStorage.getItem('authToken');
    
    socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: {
        token: authToken // Send token with connection
      }
    });

    socket.on('connect', () => {
      // Connected successfully
    });

    socket.on('disconnect', () => {
      // Disconnected
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
    });

    // Receive auth token from server (for new users)
    socket.on('auth-token', ({ token, userId, sessionId }) => {
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('sessionId', sessionId);
    });

    // Handle errors from server
    socket.on('error', (error) => {
      console.error('Server error:', error.message);
    });

    // Handle being kicked from room
    socket.on('kicked', ({ roomId, reason }) => {
      alert(`You were kicked from the room: ${reason || 'No reason provided'}`);
      window.location.href = '/';
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

// Get user's permanent ID
export const getUserId = () => {
  return localStorage.getItem('userId') || null;
};

// Clear auth (logout)
export const clearAuth = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('sessionId');
  disconnectSocket();
};

