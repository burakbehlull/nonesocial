import express from 'express';
import Report from '../models/Report.js';
import { hashIP, getSocketIP } from '../utils/analytics.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';
import { 
  sanitizeString, 
  sanitizeEmail, 
  sanitizeRoomId, 
  sanitizeUserId 
} from '../utils/sanitize.js';

const router = express.Router();

// Rate limiter - 1 saat içinde 5 rapor
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Çok fazla rapor gönderdiniz, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create report (public endpoint)
router.post('/create', reportLimiter, async (req, res) => {
  try {
    // Sanitize and validate inputs
    const validCategories = ['harassment', 'abuse', 'spam', 'inappropriate', 'illegal', 'other'];
    
    let category, subject, description, roomId, userId, email, reporterUserId;

    try {
      // Validate category (enum)
      category = req.body.category?.toLowerCase().trim();
      if (!category || !validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz kategori'
        });
      }

      // Sanitize subject
      if (!req.body.subject) {
        return res.status(400).json({
          success: false,
          message: 'Konu gerekli'
        });
      }
      subject = sanitizeString(req.body.subject, {
        maxLength: 200,
        minLength: 3
      });

      // Sanitize description
      if (!req.body.description) {
        return res.status(400).json({
          success: false,
          message: 'Açıklama gerekli'
        });
      }
      description = sanitizeString(req.body.description, {
        minLength: 10,
        maxLength: 2000,
        allowNewlines: true
      });

      // Validate at least one target
      if (!req.body.roomId && !req.body.userId) {
        return res.status(400).json({
          success: false,
          message: 'Oda ID veya Kullanıcı ID gerekli'
        });
      }

      // Sanitize roomId if provided
      if (req.body.roomId) {
        roomId = sanitizeRoomId(req.body.roomId);
      }

      // Sanitize userId if provided
      if (req.body.userId) {
        userId = sanitizeUserId(req.body.userId);
      }

      // Sanitize reporter userId if provided
      if (req.body.reporterUserId) {
        reporterUserId = sanitizeUserId(req.body.reporterUserId);
      }

      // Sanitize email if provided
      if (req.body.email) {
        email = sanitizeEmail(req.body.email);
      }

    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message || 'Geçersiz veri'
      });
    }

    // Get reporter info
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.socket.remoteAddress || '127.0.0.1';
    const ipHash = hashIP(ip);

    // Determine priority based on category
    let priority = 'medium';
    if (category === 'harassment' || category === 'abuse') {
      priority = 'high';
    } else if (category === 'spam') {
      priority = 'low';
    }

    // Create report
    const report = await Report.create({
      category,
      subject,
      description,
      roomId: roomId || undefined,
      userId: userId || undefined,
      reportedBy: {
        userId: reporterUserId || undefined,
        ipHash,
        email: email || undefined
      },
      priority,
      status: 'pending'
    });

    logger.info({
      type: 'REPORT_CREATED',
      reportId: report._id,
      category,
      priority,
      roomId,
      userId,
      ipHash
    });

    res.status(201).json({
      success: true,
      message: 'Raporunuz başarıyla gönderildi',
      reportId: report._id
    });

  } catch (error) {
    logger.error({
      type: 'REPORT_CREATE_ERROR',
      error: error.message,
      stack: error.stack
    });

    // Don't expose internal errors
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

export default router;
