import express from 'express';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import SessionLog from '../models/SessionLog.js';
import Report from '../models/Report.js';
import { generateAdminToken } from '../middleware/adminAuth.js';
import { adminAuth, checkPermission, superAdminOnly } from '../middleware/adminAuth.js';
import logger from '../utils/logger.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Çok fazla giriş denemesi, lütfen daha sonra tekrar deneyin',
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== PUBLIC ROUTES (No auth required) =====

// Admin login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre gerekli' 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username: username.toLowerCase() });

    if (!admin) {
      logger.warn({
        type: 'ADMIN_LOGIN_FAILED',
        reason: 'Admin not found',
        username,
        ip: req.ip
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      const remainingTime = Math.ceil((admin.lockUntil - Date.now()) / 1000 / 60);
      
      logger.warn({
        type: 'ADMIN_LOGIN_LOCKED',
        adminId: admin._id,
        username: admin.username,
        remainingTime,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        success: false, 
        message: `Hesap kilitli. ${remainingTime} dakika sonra tekrar deneyin.` 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.warn({
        type: 'ADMIN_LOGIN_INACTIVE',
        adminId: admin._id,
        username: admin.username,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        success: false, 
        message: 'Admin hesabı devre dışı' 
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      logger.warn({
        type: 'ADMIN_LOGIN_FAILED',
        reason: 'Invalid password',
        adminId: admin._id,
        username: admin.username,
        attempts: admin.loginAttempts + 1,
        ip: req.ip
      });
      
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Generate token
    const token = generateAdminToken(admin);

    logger.info({
      type: 'ADMIN_LOGIN_SUCCESS',
      adminId: admin._id,
      username: admin.username,
      role: admin.role,
      ip: req.ip
    });

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_LOGIN_ERROR',
      error: error.message,
      ip: req.ip
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// ===== PROTECTED ROUTES (Auth required) =====

// Verify token (check if logged in)
router.get('/verify', adminAuth, async (req, res) => {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      username: req.admin.username,
      role: req.admin.role,
      permissions: req.admin.permissions
    }
  });
});

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalUsers, totalRooms, activeSessions, totalAdmins] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      SessionLog.countDocuments({ disconnectedAt: null }),
      Admin.countDocuments({ isActive: true })
    ]);

    // Get stats from last 24 hours
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [newUsers24h, newRooms24h, newSessions24h] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last24h } }),
      Room.countDocuments({ createdAt: { $gte: last24h } }),
      SessionLog.countDocuments({ connectedAt: { $gte: last24h } })
    ]);

    logger.info({
      type: 'ADMIN_STATS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username
    });

    res.json({
      success: true,
      stats: {
        total: {
          users: totalUsers,
          rooms: totalRooms,
          activeSessions,
          admins: totalAdmins
        },
        last24h: {
          newUsers: newUsers24h,
          newRooms: newRooms24h,
          newSessions: newSessions24h
        }
      }
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_STATS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Get all users (with pagination)
router.get('/users', adminAuth, checkPermission('viewUsers'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('-ipHash') // Hide hash for regular admins
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    logger.info({
      type: 'ADMIN_USERS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username,
      page,
      total
    });

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_USERS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Get all users with REAL IPs (SUPERADMIN ONLY)
router.get('/users/detailed', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find()
        .select('+ipAddress') // Include real IP (only for superadmin)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments()
    ]);

    logger.warn({
      type: 'SUPERADMIN_DETAILED_USERS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username,
      page,
      total
    });

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error({
      type: 'SUPERADMIN_USERS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Get single user details (SUPERADMIN ONLY)
router.get('/users/:userId/details', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId }).select('+ipAddress');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Get user's session history
    const sessions = await SessionLog.find({ userId })
      .sort({ connectedAt: -1 })
      .limit(10);

    // Get user's rooms
    const rooms = await Room.find({
      $or: [
        { ownerId: userId },
        { 'members.userId': userId }
      ]
    }).limit(10);

    logger.warn({
      type: 'SUPERADMIN_USER_DETAILS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username,
      targetUserId: userId
    });

    res.json({
      success: true,
      user,
      sessions,
      rooms
    });

  } catch (error) {
    logger.error({
      type: 'SUPERADMIN_USER_DETAILS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Update user data (SUPERADMIN ONLY)
router.patch('/users/:userId', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Don't allow updating sensitive fields
    delete updates._id;
    delete updates.ipHash;
    delete updates.ipAddress;
    delete updates.userId;

    const user = await User.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    logger.warn({
      type: 'SUPERADMIN_USER_UPDATED',
      adminId: req.admin._id,
      username: req.admin.username,
      targetUserId: userId,
      updates: Object.keys(updates)
    });

    res.json({
      success: true,
      message: 'Kullanıcı güncellendi',
      user
    });

  } catch (error) {
    logger.error({
      type: 'SUPERADMIN_USER_UPDATE_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
});

// Get all rooms (with pagination)
router.get('/rooms', adminAuth, checkPermission('viewRooms'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      Room.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Room.countDocuments()
    ]);

    logger.info({
      type: 'ADMIN_ROOMS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username,
      page,
      total
    });

    res.json({
      success: true,
      rooms,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_ROOMS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Ban user
router.post('/users/:userId/ban', adminAuth, checkPermission('banUsers'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body; // duration in days

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    const bannedUntil = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null;

    user.banned = {
      isBanned: true,
      bannedAt: new Date(),
      bannedReason: reason || 'Kötüye kullanım',
      bannedUntil,
      bannedBy: req.admin.username
    };

    await user.save();

    logger.warn({
      type: 'USER_BANNED',
      userId,
      bannedBy: req.admin.username,
      reason,
      duration
    });

    res.json({
      success: true,
      message: 'Kullanıcı yasaklandı'
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_BAN_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Unban user
router.post('/users/:userId/unban', adminAuth, checkPermission('banUsers'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kullanıcı bulunamadı' 
      });
    }

    user.banned = {
      isBanned: false,
      bannedAt: null,
      bannedReason: null,
      bannedUntil: null,
      bannedBy: null
    };

    await user.save();

    logger.info({
      type: 'USER_UNBANNED',
      userId,
      unbannedBy: req.admin.username
    });

    res.json({
      success: true,
      message: 'Kullanıcı yasağı kaldırıldı'
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_UNBAN_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Delete room (superadmin only)
router.delete('/rooms/:roomId', adminAuth, superAdminOnly, checkPermission('deleteRooms'), async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ 
        success: false, 
        message: 'Oda bulunamadı' 
      });
    }

    await Room.deleteOne({ roomId });

    logger.warn({
      type: 'ROOM_DELETED',
      roomId,
      deletedBy: req.admin.username
    });

    res.json({
      success: true,
      message: 'Oda silindi'
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_DELETE_ROOM_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// ===== REPORT MANAGEMENT =====

// Get all reports (with pagination and filters)
router.get('/reports', adminAuth, checkPermission('viewReports'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status; // pending, reviewed, resolved, rejected
    const category = req.query.category;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .sort({ priority: -1, createdAt: -1 }) // High priority first
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter)
    ]);

    logger.info({
      type: 'ADMIN_REPORTS_VIEWED',
      adminId: req.admin._id,
      username: req.admin.username,
      page,
      total,
      filter
    });

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_REPORTS_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Get single report
router.get('/reports/:id', adminAuth, checkPermission('viewReports'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    res.json({
      success: true,
      report
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_REPORT_GET_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Update report status
router.patch('/reports/:id/status', adminAuth, checkPermission('viewReports'), async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    report.status = status;
    report.reviewedBy = req.admin.username;
    report.reviewedAt = new Date();
    if (adminNotes) report.adminNotes = adminNotes;

    await report.save();

    logger.info({
      type: 'REPORT_STATUS_UPDATED',
      reportId: report._id,
      status,
      adminUsername: req.admin.username
    });

    res.json({
      success: true,
      message: 'Rapor durumu güncellendi',
      report
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_REPORT_UPDATE_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Add action to report (ban user, delete room, etc.)
router.post('/reports/:id/action', adminAuth, checkPermission('banUsers'), async (req, res) => {
  try {
    const { actionType, details } = req.body;

    if (!['ban_user', 'delete_room', 'warning', 'no_action'].includes(actionType)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz aksiyon'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    // Perform action
    if (actionType === 'ban_user' && report.userId) {
      const user = await User.findOne({ userId: report.userId });
      if (user) {
        user.banned = {
          isBanned: true,
          bannedAt: new Date(),
          bannedReason: `Report: ${report.subject}`,
          bannedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          bannedBy: req.admin.username
        };
        await user.save();
      }
    } else if (actionType === 'delete_room' && report.roomId && req.admin.role === 'superadmin') {
      await Room.deleteOne({ roomId: report.roomId });
    }

    // Add action to report
    report.actions.push({
      type: actionType,
      performedBy: req.admin.username,
      performedAt: new Date(),
      details: details || ''
    });

    // Update status to resolved if action taken
    if (actionType !== 'no_action') {
      report.status = 'resolved';
      report.reviewedBy = req.admin.username;
      report.reviewedAt = new Date();
    }

    await report.save();

    logger.warn({
      type: 'REPORT_ACTION_PERFORMED',
      reportId: report._id,
      actionType,
      adminUsername: req.admin.username
    });

    res.json({
      success: true,
      message: 'Aksiyon gerçekleştirildi',
      report
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_REPORT_ACTION_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

// Send response to reporter
router.post('/reports/:id/respond', adminAuth, checkPermission('viewReports'), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mesaj gerekli'
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Rapor bulunamadı'
      });
    }

    report.response = {
      sent: true,
      sentAt: new Date(),
      message
    };

    await report.save();

    // TODO: Send email if reporter provided email
    // if (report.reportedBy.email) {
    //   await sendEmail(report.reportedBy.email, 'Rapor Yanıtı', message);
    // }

    logger.info({
      type: 'REPORT_RESPONSE_SENT',
      reportId: report._id,
      adminUsername: req.admin.username
    });

    res.json({
      success: true,
      message: 'Yanıt gönderildi'
    });

  } catch (error) {
    logger.error({
      type: 'ADMIN_REPORT_RESPOND_ERROR',
      error: error.message,
      adminId: req.admin._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
});

export default router;
