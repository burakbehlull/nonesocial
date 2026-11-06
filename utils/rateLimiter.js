import logger from './logger.js';

class RateLimiter {
  constructor(options = {}) {
    this.points = options.points || 10;
    this.duration = options.duration || 1; // seconds
    this.blockDuration = options.blockDuration || 60; // seconds
    this.storage = new Map(); // userId -> { count, resetAt, blockedUntil }
  }

  /**
   * Consume a point for the user
   * @returns {Promise<boolean>} true if allowed, false if rate limited
   */
  async consume(userId) {
    const now = Date.now();
    const userKey = String(userId);

    // Clean expired entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    const userData = this.storage.get(userKey);

    // Check if user is blocked
    if (userData?.blockedUntil && userData.blockedUntil > now) {
      const remainingTime = Math.ceil((userData.blockedUntil - now) / 1000);
      logger.warn({
        type: 'RATE_LIMIT_BLOCKED',
        userId,
        remainingTime
      });
      throw new Error(`Rate limited. Try again in ${remainingTime} seconds`);
    }

    // Initialize or reset counter
    if (!userData || userData.resetAt < now) {
      this.storage.set(userKey, {
        count: 1,
        resetAt: now + this.duration * 1000,
        blockedUntil: null
      });
      return true;
    }

    // Increment counter
    userData.count++;

    // Check if limit exceeded
    if (userData.count > this.points) {
      userData.blockedUntil = now + this.blockDuration * 1000;
      this.storage.set(userKey, userData);
      
      logger.warn({
        type: 'RATE_LIMIT_EXCEEDED',
        userId,
        count: userData.count,
        limit: this.points,
        blockDuration: this.blockDuration
      });
      
      throw new Error(`Rate limit exceeded. Blocked for ${this.blockDuration} seconds`);
    }

    this.storage.set(userKey, userData);
    return true;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.storage.entries()) {
      if (value.resetAt < now && (!value.blockedUntil || value.blockedUntil < now)) {
        this.storage.delete(key);
      }
    }
  }

  /**
   * Reset user's rate limit
   */
  reset(userId) {
    this.storage.delete(String(userId));
  }
}

// Create rate limiters for different actions
export const messageLimiter = new RateLimiter({
  points: 10, // 10 messages
  duration: 1, // per second
  blockDuration: 30 // 30 seconds block
});

export const createRoomLimiter = new RateLimiter({
  points: 5, // 5 rooms
  duration: 3600, // per hour
  blockDuration: 1800 // 30 minutes block
});

export const joinRoomLimiter = new RateLimiter({
  points: 20, // 20 joins
  duration: 60, // per minute
  blockDuration: 300 // 5 minutes block
});

export const changeNameLimiter = new RateLimiter({
  points: 5, // 5 changes
  duration: 60, // per minute
  blockDuration: 120 // 2 minutes block
});

export const webrtcLimiter = new RateLimiter({
  points: 50, // 50 signals
  duration: 10, // per 10 seconds
  blockDuration: 60 // 1 minute block
});
