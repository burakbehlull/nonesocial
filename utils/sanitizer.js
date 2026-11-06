import createDOMPurify from 'isomorphic-dompurify';
import validator from 'validator';
import logger from './logger.js';

const DOMPurify = createDOMPurify();

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeText = (text, options = {}) => {
  if (typeof text !== 'string') return '';
  
  const {
    maxLength = 500,
    allowHTML = false,
    trim = true
  } = options;

  // Trim whitespace
  let sanitized = trim ? text.trim() : text;

  // Remove or escape HTML
  if (allowHTML) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href']
    });
  } else {
    sanitized = validator.escape(sanitized);
  }

  // Length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Log suspicious patterns
  if (/<script|javascript:|onerror=|onclick=/i.test(text)) {
    logger.warn({
      type: 'XSS_ATTEMPT',
      originalText: text,
      sanitized
    });
  }

  return sanitized;
};

/**
 * Sanitize room name
 */
export const sanitizeRoomName = (name) => {
  return sanitizeText(name, { maxLength: 50, allowHTML: false });
};

/**
 * Sanitize user name
 */
export const sanitizeUsername = (name) => {
  return sanitizeText(name, { maxLength: 20, allowHTML: false });
};

/**
 * Sanitize message
 */
export const sanitizeMessage = (message) => {
  return sanitizeText(message, { maxLength: 500, allowHTML: false });
};

/**
 * Validate room password
 */
export const validatePassword = (password) => {
  if (!password) return null;
  
  if (typeof password !== 'string') {
    throw new Error('Password must be a string');
  }
  
  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }
  
  if (password.length > 50) {
    throw new Error('Password too long (max 50 characters)');
  }
  
  return password;
};
