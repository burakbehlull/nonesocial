import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import logger from './logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate JWT token for anonymous user
 */
export const generateToken = () => {
  const userId = nanoid(16); // Permanent user ID
  const sessionId = nanoid(12); // Session ID
  
  const payload = {
    userId,
    sessionId,
    createdAt: Date.now()
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  
  logger.info({
    type: 'TOKEN_GENERATED',
    userId,
    sessionId
  });

  return { token, userId, sessionId };
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    logger.warn({
      type: 'TOKEN_VERIFICATION_FAILED',
      error: error.message
    });
    return { valid: false, error: error.message };
  }
};

/**
 * Socket.io authentication middleware
 */
export const socketAuthMiddleware = (socket, next) => {
  const token = socket.handshake.auth.token;

  // Allow connection without token (will generate new one)
  if (!token) {
    // Generate new token
    const { token: newToken, userId, sessionId } = generateToken();
    socket.userId = userId;
    socket.sessionId = sessionId;
    socket.isNewUser = true;
    
    // Send token to client
    socket.emit('auth-token', { token: newToken, userId, sessionId });
    
    logger.info({
      type: 'NEW_USER_CONNECTED',
      userId,
      ip: socket.handshake.address
    });
    
    return next();
  }

  // Verify existing token
  const { valid, data, error } = verifyToken(token);

  if (!valid) {
    logger.warn({
      type: 'AUTH_FAILED',
      ip: socket.handshake.address,
      error
    });
    return next(new Error('Authentication failed'));
  }

  socket.userId = data.userId;
  socket.sessionId = data.sessionId;
  socket.isNewUser = false;

  logger.info({
    type: 'USER_RECONNECTED',
    userId: data.userId,
    sessionId: data.sessionId
  });

  next();
};
