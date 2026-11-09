import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import logger from '../utils/logger.js';

// JWT Secret (admin için ayrı secret kullan)
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_admin';

// Generate admin JWT token
export const generateAdminToken = (admin) => {
  return jwt.sign(
    {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      type: 'admin' // Token tipini belirt
    },
    ADMIN_JWT_SECRET,
    { expiresIn: '8h' } // 8 saat geçerli
  );
};

// Verify admin JWT token
export const verifyAdminToken = (token) => {
  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    
    // Token tipini kontrol et
    if (decoded.type !== 'admin') {
      throw new Error('Invalid token type');
    }
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

// Admin authentication middleware
export const adminAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({
        type: 'ADMIN_AUTH_FAILED',
        reason: 'No token provided',
        ip: req.ip
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkisiz erişim - Token gerekli' 
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token
    let decoded;
    try {
      decoded = verifyAdminToken(token);
    } catch (error) {
      logger.warn({
        type: 'ADMIN_AUTH_FAILED',
        reason: 'Invalid token',
        ip: req.ip
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz veya süresi dolmuş token' 
      });
    }

    // Get admin from database
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      logger.warn({
        type: 'ADMIN_AUTH_FAILED',
        reason: 'Admin not found',
        adminId: decoded.id,
        ip: req.ip
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Admin bulunamadı' 
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      logger.warn({
        type: 'ADMIN_AUTH_FAILED',
        reason: 'Admin inactive',
        adminId: admin._id,
        username: admin.username,
        ip: req.ip
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Admin hesabı devre dışı' 
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      logger.warn({
        type: 'ADMIN_AUTH_FAILED',
        reason: 'Admin locked',
        adminId: admin._id,
        username: admin.username,
        lockUntil: admin.lockUntil,
        ip: req.ip
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Hesap kilitli - Çok fazla başarısız giriş denemesi' 
      });
    }

    // Attach admin to request
    req.admin = admin;
    
    logger.info({
      type: 'ADMIN_AUTH_SUCCESS',
      adminId: admin._id,
      username: admin.username,
      role: admin.role,
      ip: req.ip,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error({
      type: 'ADMIN_AUTH_ERROR',
      error: error.message,
      ip: req.ip
    });
    
    return res.status(500).json({ 
      success: false, 
      message: 'Sunucu hatası' 
    });
  }
};

// Check specific permission
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Yetkisiz erişim' 
      });
    }

    // Superadmin has all permissions
    if (req.admin.role === 'superadmin') {
      return next();
    }

    // Check permission
    if (!req.admin.permissions[permission]) {
      logger.warn({
        type: 'ADMIN_PERMISSION_DENIED',
        adminId: req.admin._id,
        username: req.admin.username,
        permission,
        ip: req.ip
      });
      
      return res.status(403).json({ 
        success: false, 
        message: 'Bu işlem için yetkiniz yok' 
      });
    }

    next();
  };
};

// Superadmin only
export const superAdminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'superadmin') {
    logger.warn({
      type: 'SUPERADMIN_REQUIRED',
      adminId: req.admin?._id,
      username: req.admin?.username,
      role: req.admin?.role,
      ip: req.ip
    });
    
    return res.status(403).json({ 
      success: false, 
      message: 'Sadece süper adminler bu işlemi yapabilir' 
    });
  }
  
  next();
};

export default {
  generateAdminToken,
  verifyAdminToken,
  adminAuth,
  checkPermission,
  superAdminOnly
};
