import express from 'express';
import Report from '../models/Report.js';
import { hashIP, getSocketIP } from '../utils/analytics.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

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
    const { category, subject, roomId, userId, description, email } = req.body;

    // Validation
    if (!category || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Kategori, konu ve açıklama gerekli'
      });
    }

    if (!roomId && !userId) {
      return res.status(400).json({
        success: false,
        message: 'Oda ID veya Kullanıcı ID gerekli'
      });
    }

    if (description.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Açıklama en az 10 karakter olmalıdır'
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
        userId: req.body.reporterUserId, // Opsiyonel, frontend'den gönderilirse
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
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

export default router;
