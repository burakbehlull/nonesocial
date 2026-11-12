import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@services/socket';

/**
 * Custom hook for handling typing indicators
 * Manages typing state and communicates with backend via Socket.IO
 * 
 * @param {string} roomId - Room ID
 * @param {number} typingTimeout - Timeout in ms (default: 3000)
 * @returns {object} - { typingUsers, startTyping, stopTyping }
 */
export function useTypingIndicator(roomId, typingTimeout = 3000) {
  const [typingUsers, setTypingUsers] = useState([]); // Array of { userId, name, timestamp }
  const typingTimeoutRef = useRef(null);
  const cleanupTimersRef = useRef({});
  const isTypingRef = useRef(false);

  const socket = getSocket();

  // Start typing (called on input)
  const startTyping = useCallback(() => {
    if (!socket || !roomId || isTypingRef.current) return;

    isTypingRef.current = true;
    socket.emit('startTyping', { roomId });

    // Auto-stop after timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, typingTimeout);
  }, [socket, roomId, typingTimeout]);

  // Stop typing (called on send or timeout)
  const stopTyping = useCallback(() => {
    if (!socket || !roomId || !isTypingRef.current) return;

    isTypingRef.current = false;
    socket.emit('stopTyping', { roomId });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [socket, roomId]);

  // Listen to typing events
  useEffect(() => {
    if (!socket || !roomId) return;

    // User started typing
    const handleUserTyping = ({ userId, name }) => {
      setTypingUsers(prev => {
        // Check if user is already in the list
        const exists = prev.find(u => u.userId === userId);
        if (exists) {
          // Update timestamp
          return prev.map(u => 
            u.userId === userId 
              ? { ...u, timestamp: Date.now() } 
              : u
          );
        } else {
          // Add new user
          return [...prev, { userId, name, timestamp: Date.now() }];
        }
      });

      // Auto-remove after timeout
      if (cleanupTimersRef.current[userId]) {
        clearTimeout(cleanupTimersRef.current[userId]);
      }

      cleanupTimersRef.current[userId] = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.userId !== userId));
        delete cleanupTimersRef.current[userId];
      }, typingTimeout);
    };

    // User stopped typing
    const handleUserStoppedTyping = ({ userId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== userId));

      // Clear cleanup timer
      if (cleanupTimersRef.current[userId]) {
        clearTimeout(cleanupTimersRef.current[userId]);
        delete cleanupTimersRef.current[userId];
      }
    };

    socket.on('userTyping', handleUserTyping);
    socket.on('userStoppedTyping', handleUserStoppedTyping);

    return () => {
      socket.off('userTyping', handleUserTyping);
      socket.off('userStoppedTyping', handleUserStoppedTyping);

      // Cleanup all timers
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      Object.values(cleanupTimersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, [socket, roomId, typingTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTyping();
    };
  }, [stopTyping]);

  return {
    typingUsers,
    startTyping,
    stopTyping
  };
}
