import validator from 'validator';
import mongoSanitize from 'express-mongo-sanitize';

/**
 * Sanitize user input to prevent XSS and injection attacks
 */

// HTML Entity encoding to prevent XSS
export function sanitizeHTML(input) {
  if (!input || typeof input !== 'string') return input;
  
  return validator.escape(input);
}

// Remove/replace dangerous characters
export function sanitizeString(input, options = {}) {
  if (!input || typeof input !== 'string') return input;
  
  const {
    maxLength = 2000,
    allowNewlines = true,
    allowHTML = false
  } = options;
  
  let sanitized = input;
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Escape HTML if not allowed
  if (!allowHTML) {
    sanitized = validator.escape(sanitized);
  }
  
  // Remove newlines if not allowed
  if (!allowNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }
  
  return sanitized;
}

// Validate and sanitize email
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  // Trim and lowercase
  email = email.trim().toLowerCase();
  
  // Validate format
  if (!validator.isEmail(email)) {
    return null;
  }
  
  // Normalize
  email = validator.normalizeEmail(email, {
    gmail_remove_dots: false,
    gmail_remove_subaddress: false
  });
  
  // Max length check
  if (email.length > 254) return null;
  
  return email;
}

// Validate MongoDB ObjectId
export function isValidObjectId(id) {
  if (!id || typeof id !== 'string') return false;
  return /^[a-f\d]{24}$/i.test(id);
}

// Sanitize MongoDB ObjectId with validation
export function sanitizeObjectId(id) {
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid ID format');
  }
  
  if (!validator.isMongoId(id)) {
    throw new Error('Invalid ID format');
  }
  
  return id;
}

// Sanitize object for MongoDB (prevent NoSQL injection)
export function sanitizeMongoObject(obj) {
  return mongoSanitize.sanitize(obj, {
    replaceWith: '_'
  });
}

// Validate category
export function validateCategory(category) {
  const validCategories = ['spam', 'harassment', 'inappropriate', 'abuse', 'other'];
  return validCategories.includes(category) ? category : null;
}

// Validate status
export function validateStatus(status) {
  const validStatuses = ['pending', 'reviewed', 'resolved', 'rejected'];
  return validStatuses.includes(status) ? status : null;
}

// Validate priority
export function validatePriority(priority) {
  const validPriorities = ['low', 'medium', 'high'];
  return validPriorities.includes(priority) ? priority : null;
}

// Validate room ID (room_ prefix + alphanumeric, 5-20 chars)
export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') return null;
  
  // Trim
  roomId = roomId.trim();
  
  // Format: room_xxxxx
  if (!/^room_[a-zA-Z0-9]{5,20}$/.test(roomId)) return null;
  
  return roomId;
}

// Sanitize room ID with proper validation
export function sanitizeRoomId(roomId) {
  const validated = validateRoomId(roomId);
  if (!validated) {
    throw new Error('Invalid room ID format');
  }
  return validated;
}

// Validate user ID (UUID v4 format)
export function validateUserId(userId) {
  if (!userId || typeof userId !== 'string') return null;
  
  // Trim
  userId = userId.trim();
  
  // UUID v4 validation
  if (!validator.isUUID(userId, 4)) return null;
  
  return userId;
}

// Sanitize user ID with proper validation
export function sanitizeUserId(userId) {
  const validated = validateUserId(userId);
  if (!validated) {
    throw new Error('Invalid user ID format');
  }
  return validated;
}

// Rate limit key generator (more secure than just IP)
export function getRateLimitKey(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket.remoteAddress || 
             'unknown';
  
  const userAgent = req.headers['user-agent'] || 'unknown';
  
  // Combine IP + User Agent hash for better rate limiting
  return `${ip}:${userAgent.substring(0, 50)}`;
}

// Sanitize report input
export function sanitizeReportInput(input) {
  const sanitized = {};
  
  // Category
  sanitized.category = validateCategory(input.category);
  if (!sanitized.category) {
    throw new Error('Geçersiz kategori');
  }
  
  // Subject
  if (!input.subject || typeof input.subject !== 'string') {
    throw new Error('Konu gerekli');
  }
  sanitized.subject = sanitizeString(input.subject, {
    maxLength: 100,
    allowNewlines: false,
    allowHTML: false
  });
  if (!sanitized.subject || sanitized.subject.length === 0) {
    throw new Error('Konu boş olamaz');
  }
  
  // Description
  if (!input.description || typeof input.description !== 'string') {
    throw new Error('Açıklama gerekli');
  }
  sanitized.description = sanitizeString(input.description, {
    maxLength: 2000,
    allowNewlines: true,
    allowHTML: false
  });
  if (sanitized.description.length < 10) {
    throw new Error('Açıklama en az 10 karakter olmalıdır');
  }
  
  // Room ID (optional)
  if (input.roomId) {
    sanitized.roomId = validateRoomId(input.roomId);
    if (!sanitized.roomId) {
      throw new Error('Geçersiz oda ID formatı');
    }
  }
  
  // User ID (optional)
  if (input.userId) {
    sanitized.userId = validateUserId(input.userId);
    if (!sanitized.userId) {
      throw new Error('Geçersiz kullanıcı ID formatı');
    }
  }
  
  // At least one of roomId or userId required
  if (!sanitized.roomId && !sanitized.userId) {
    throw new Error('Oda ID veya Kullanıcı ID gerekli');
  }
  
  // Email (optional)
  if (input.email) {
    sanitized.email = sanitizeEmail(input.email);
    if (!sanitized.email) {
      throw new Error('Geçersiz e-posta formatı');
    }
  }
  
  return sanitized;
}

export default {
  sanitizeHTML,
  sanitizeString,
  sanitizeEmail,
  isValidObjectId,
  sanitizeObjectId,
  sanitizeMongoObject,
  validateCategory,
  validateStatus,
  validatePriority,
  validateRoomId,
  sanitizeRoomId,
  validateUserId,
  sanitizeUserId,
  getRateLimitKey,
  sanitizeReportInput,
  sanitizeReportReason,
  sanitizeReportStatus,
  sanitizeAdminNote,
  sanitizePagination,
  sanitizeSort,
  sanitizeDateRange,
  isSafeRegex
};

// Sanitize report reason - enum validation
export function sanitizeReportReason(reason) {
  const validReasons = [
    'inappropriate',
    'spam',
    'harassment',
    'illegal',
    'abuse',
    'other'
  ];

  if (!validReasons.includes(reason)) {
    throw new Error('Invalid report reason');
  }

  return reason;
}

// Sanitize report status - enum validation
export function sanitizeReportStatus(status) {
  const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed', 'rejected'];

  if (!validStatuses.includes(status)) {
    throw new Error('Invalid report status');
  }

  return status;
}

// Sanitize admin note
export function sanitizeAdminNote(note) {
  if (!note) {
    return '';
  }

  return sanitizeString(note, {
    maxLength: 500,
    allowNewlines: true,
    allowHTML: false
  });
}

// Sanitize pagination parameters
export function sanitizePagination(params = {}) {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;

  // Enforce limits
  if (page < 1 || page > 1000) {
    throw new Error('Invalid page number');
  }

  if (limit < 1 || limit > 100) {
    throw new Error('Invalid limit (max 100)');
  }

  return { page, limit };
}

// Sanitize sort parameters to prevent injection
export function sanitizeSort(sort, allowedFields = []) {
  if (!sort || typeof sort !== 'object') {
    return {};
  }

  const sanitized = {};

  for (const [field, direction] of Object.entries(sort)) {
    // Only allow whitelisted fields
    if (!allowedFields.includes(field)) {
      continue;
    }

    // Only allow 1 (asc) or -1 (desc)
    if (direction !== 1 && direction !== -1) {
      continue;
    }

    sanitized[field] = direction;
  }

  return sanitized;
}

// Sanitize date range
export function sanitizeDateRange(dateRange = {}) {
  const sanitized = {};

  if (dateRange.from) {
    const from = new Date(dateRange.from);
    if (isNaN(from.getTime())) {
      throw new Error('Invalid from date');
    }
    sanitized.from = from;
  }

  if (dateRange.to) {
    const to = new Date(dateRange.to);
    if (isNaN(to.getTime())) {
      throw new Error('Invalid to date');
    }
    sanitized.to = to;
  }

  // Validate range
  if (sanitized.from && sanitized.to && sanitized.from > sanitized.to) {
    throw new Error('Invalid date range: from must be before to');
  }

  return sanitized;
}

// Prevent ReDoS attacks by validating regex patterns
export function isSafeRegex(pattern) {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /(\*|\+|\{)\s*(\*|\+|\{)/, // Nested quantifiers
    /\(\?.*\)\s*(\*|\+|\{)/, // Quantified lookaheads/lookbehinds
    /(\||\\|)\s*(\*|\+|\{)/ // Alternation with quantifiers
  ];

  return !dangerousPatterns.some(dp => dp.test(pattern));
}
