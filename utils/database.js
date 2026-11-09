import mongoose from 'mongoose';
import logger from './logger.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });

    logger.info({
      type: 'DATABASE_CONNECTED',
      host: conn.connection.host,
      database: conn.connection.name
    });

    console.log(`📊 MongoDB connected: ${conn.connection.host}`);

    // TTL Index cleanup her gün çalışır (MongoDB otomatik)
    scheduleDataCleanup();

    return conn;
  } catch (error) {
    logger.error({
      type: 'DATABASE_ERROR',
      error: error.message
    });
    
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Server will continue without analytics');
    
    // Don't exit, just warn
    return null;
  }
};

// Eski verileri temizle (backup olarak, TTL zaten var)
const scheduleDataCleanup = () => {
  // Her gün bir kez çalıştır
  setInterval(async () => {
    try {
      const User = mongoose.model('User');
      const Room = mongoose.model('Room');
      const SessionLog = mongoose.model('SessionLog');

      const now = new Date();

      // 90 günden eski inactive user'ları sil
      const usersDeleted = await User.deleteMany({
        lastSeen: { $lt: new Date(now - 90 * 24 * 60 * 60 * 1000) }
      });

      // 30 günden eski closed room'ları sil
      const roomsDeleted = await Room.deleteMany({
        status: 'closed',
        closedAt: { $lt: new Date(now - 30 * 24 * 60 * 60 * 1000) }
      });

      // 7 günden eski session log'ları sil
      const logsDeleted = await SessionLog.deleteMany({
        disconnectedAt: { $lt: new Date(now - 7 * 24 * 60 * 60 * 1000) }
      });

      logger.info({
        type: 'DATA_CLEANUP',
        usersDeleted: usersDeleted.deletedCount,
        roomsDeleted: roomsDeleted.deletedCount,
        logsDeleted: logsDeleted.deletedCount
      });
    } catch (error) {
      logger.error({
        type: 'CLEANUP_ERROR',
        error: error.message
      });
    }
  }, 24 * 60 * 60 * 1000); // Her 24 saatte bir
};

export default { connectDB };
