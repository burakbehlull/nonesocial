import User from '../models/User.js';
import SessionLog from '../models/SessionLog.js';
import Room from '../models/Room.js';
import { 
  hashIP, 
  getLocationFromIP, 
  parseBrowserInfo, 
  getSocketIP 
} from '../utils/analytics.js';
import logger from '../utils/logger.js';

// Socket connection'da tracking başlat
export const initializeTracking = async (socket) => {
  try {
    const ip = getSocketIP(socket);
    const ipHash = hashIP(ip);
    const userAgent = socket.handshake.headers['user-agent'] || '';
    
    const location = getLocationFromIP(ip);
    const browser = parseBrowserInfo(userAgent);

    // User kaydını oluştur veya güncelle
    let user = await User.findOne({ userId: socket.userId });
    
    if (!user) {
      user = await User.create({
        userId: socket.userId,
        ipHash,
        location,
        browser,
        firstSeen: new Date(),
        lastSeen: new Date()
      });

      logger.info({
        type: 'NEW_USER_TRACKED',
        userId: socket.userId,
        country: location.country,
        browser: browser.name
      });
    } else {
      // Update last seen ve expiration
      await user.updateActivity();
    }

    // Session Log oluştur
    const sessionLog = await SessionLog.create({
      userId: socket.userId,
      socketId: socket.id,
      ipHash,
      browser,
      location,
      connectedAt: new Date()
    });

    // Socket'e session log ID'sini sakla
    socket.sessionLogId = sessionLog._id;
    socket.userAnalytics = {
      ipHash,
      location,
      browser
    };

    logger.info({
      type: 'TRACKING_INITIALIZED',
      userId: socket.userId,
      sessionLogId: sessionLog._id.toString()
    });

  } catch (error) {
    logger.error({
      type: 'TRACKING_INIT_ERROR',
      userId: socket.userId,
      error: error.message
    });
  }
};

// Socket disconnect'de tracking kapat
export const finalizeTracking = async (socket) => {
  try {
    if (!socket.sessionLogId) return;

    const sessionLog = await SessionLog.findById(socket.sessionLogId);
    
    if (sessionLog) {
      sessionLog.disconnectedAt = new Date();
      sessionLog.duration = Math.floor((sessionLog.disconnectedAt - sessionLog.connectedAt) / 1000);
      
      await sessionLog.addEvent('disconnect', {
        reason: socket.disconnectReason || 'unknown'
      });

      await sessionLog.save();

      logger.info({
        type: 'TRACKING_FINALIZED',
        userId: socket.userId,
        duration: sessionLog.duration
      });
    }

  } catch (error) {
    logger.error({
      type: 'TRACKING_FINALIZE_ERROR',
      userId: socket.userId,
      error: error.message
    });
  }
};

// Room create tracking
export const trackRoomCreate = async (socket, roomId, roomName, hasPassword, limit, videoEnabled) => {
  try {
    // Room oluştur
    const room = await Room.create({
      roomId,
      name: roomName,
      hasPassword,
      limit,
      videoEnabled,
      ownerId: socket.userId,
      members: [],
      status: 'active'
    });

    // Owner'ı member olarak ekle
    await room.addMember(
      socket.userId,
      'Nobody', // Default name
      socket.userAnalytics.ipHash,
      {
        name: socket.userAnalytics.browser.name,
        os: socket.userAnalytics.browser.os,
        device: socket.userAnalytics.browser.device
      }
    );

    // User stats güncelle
    await User.updateOne(
      { userId: socket.userId },
      { 
        $inc: { 'stats.roomsCreated': 1, 'stats.totalRooms': 1 },
        $set: { 'stats.lastActive': new Date() }
      }
    );

    // Session log'a ekle
    if (socket.sessionLogId) {
      const sessionLog = await SessionLog.findById(socket.sessionLogId);
      if (sessionLog) {
        sessionLog.roomsVisited.push({
          roomId,
          joinedAt: new Date()
        });
        sessionLog.stats.roomsJoined += 1;
        await sessionLog.addEvent('create_room', { roomId, roomName });
      }
    }

    logger.info({
      type: 'ROOM_CREATE_TRACKED',
      userId: socket.userId,
      roomId
    });

  } catch (error) {
    logger.error({
      type: 'TRACK_ROOM_CREATE_ERROR',
      userId: socket.userId,
      roomId,
      error: error.message
    });
  }
};

// Room join tracking
export const trackRoomJoin = async (socket, roomId, roomName) => {
  try {
    // Session log'a ekle
    if (socket.sessionLogId) {
      const sessionLog = await SessionLog.findById(socket.sessionLogId);
      if (sessionLog) {
        sessionLog.roomsVisited.push({
          roomId,
          joinedAt: new Date()
        });
        sessionLog.stats.roomsJoined += 1;
        await sessionLog.addEvent('join_room', { roomId, roomName });
      }
    }

    // Room'a member olarak ekle
    const room = await Room.findOne({ roomId });
    
    if (room) {
      await room.addMember(
        socket.userId,
        'Nobody', // Default name, sonra update edilecek
        socket.userAnalytics.ipHash,
        {
          name: socket.userAnalytics.browser.name,
          os: socket.userAnalytics.browser.os,
          device: socket.userAnalytics.browser.device
        }
      );
    }

    // User stats güncelle
    await User.updateOne(
      { userId: socket.userId },
      { 
        $inc: { 'stats.roomsJoined': 1, 'stats.totalRooms': 1 },
        $set: { 'stats.lastActive': new Date() }
      }
    );

    logger.info({
      type: 'ROOM_JOIN_TRACKED',
      userId: socket.userId,
      roomId
    });

  } catch (error) {
    logger.error({
      type: 'TRACK_ROOM_JOIN_ERROR',
      userId: socket.userId,
      roomId,
      error: error.message
    });
  }
};

// Room leave tracking
export const trackRoomLeave = async (socket, roomId) => {
  try {
    // Session log'u güncelle
    if (socket.sessionLogId) {
      const sessionLog = await SessionLog.findById(socket.sessionLogId);
      if (sessionLog) {
        const roomVisit = sessionLog.roomsVisited.find(
          r => r.roomId === roomId && !r.leftAt
        );
        if (roomVisit) {
          roomVisit.leftAt = new Date();
          roomVisit.duration = Math.floor((roomVisit.leftAt - roomVisit.joinedAt) / 1000);
        }
        await sessionLog.addEvent('leave_room', { roomId });
        await sessionLog.save();
      }
    }

    // Room'dan member'ı çıkar
    const room = await Room.findOne({ roomId });
    if (room) {
      await room.removeMember(socket.userId);
    }

    logger.info({
      type: 'ROOM_LEAVE_TRACKED',
      userId: socket.userId,
      roomId
    });

  } catch (error) {
    logger.error({
      type: 'TRACK_ROOM_LEAVE_ERROR',
      userId: socket.userId,
      roomId,
      error: error.message
    });
  }
};

// Message tracking
export const trackMessage = async (socket, roomId) => {
  try {
    // Session log
    if (socket.sessionLogId) {
      await SessionLog.updateOne(
        { _id: socket.sessionLogId },
        { 
          $inc: { 'stats.messagesCount': 1 }
        }
      );
    }

    // Room stats
    const room = await Room.findOne({ roomId });
    if (room) {
      await room.incrementMessageCount(socket.userId);
    }

    // User stats
    await User.updateOne(
      { userId: socket.userId },
      { 
        $inc: { 'stats.totalMessages': 1 },
        $set: { 'stats.lastActive': new Date() }
      }
    );

  } catch (error) {
    logger.error({
      type: 'TRACK_MESSAGE_ERROR',
      userId: socket.userId,
      error: error.message
    });
  }
};

// Call tracking
export const trackCallStart = async (socket, roomId) => {
  try {
    // Session'a call start kaydet
    socket.callStartTime = new Date();

    if (socket.sessionLogId) {
      await SessionLog.updateOne(
        { _id: socket.sessionLogId },
        {
          $push: {
            events: {
              type: 'join_call',
              timestamp: new Date(),
              data: { roomId }
            }
          }
        }
      );
    }

    logger.info({
      type: 'CALL_START_TRACKED',
      userId: socket.userId,
      roomId
    });

  } catch (error) {
    logger.error({
      type: 'TRACK_CALL_START_ERROR',
      userId: socket.userId,
      error: error.message
    });
  }
};

export const trackCallEnd = async (socket, roomId) => {
  try {
    if (!socket.callStartTime) return;

    const duration = Math.floor((new Date() - socket.callStartTime) / 1000);
    const minutes = Math.floor(duration / 60);

    // Session log
    if (socket.sessionLogId) {
      await SessionLog.updateOne(
        { _id: socket.sessionLogId },
        {
          $inc: { 'stats.callMinutes': minutes },
          $push: {
            events: {
              type: 'leave_call',
              timestamp: new Date(),
              data: { roomId, duration }
            }
          }
        }
      );
    }

    // User stats
    await User.updateOne(
      { userId: socket.userId },
      {
        $inc: { 'stats.totalCallMinutes': minutes },
        $set: { 'stats.lastActive': new Date() }
      }
    );

    // Room stats
    await Room.updateOne(
      { roomId },
      {
        $inc: { 'stats.totalCallMinutes': minutes }
      }
    );

    socket.callStartTime = null;

    logger.info({
      type: 'CALL_END_TRACKED',
      userId: socket.userId,
      roomId,
      duration
    });

  } catch (error) {
    logger.error({
      type: 'TRACK_CALL_END_ERROR',
      userId: socket.userId,
      error: error.message
    });
  }
};

export default {
  initializeTracking,
  finalizeTracking,
  trackRoomCreate,
  trackRoomJoin,
  trackRoomLeave,
  trackMessage,
  trackCallStart,
  trackCallEnd
};
