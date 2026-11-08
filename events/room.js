import { nanoid } from 'nanoid';
import bcrypt from 'bcrypt';
import logger from '../utils/logger.js';
import { 
  sanitizeRoomName, 
  sanitizeUsername, 
  sanitizeMessage,
  validatePassword 
} from '../utils/sanitizer.js';
import {
  messageLimiter,
  createRoomLimiter,
  joinRoomLimiter,
  changeNameLimiter,
  webrtcLimiter
} from '../utils/rateLimiter.js';
import { schemas, validate } from '../utils/validation.js';

const rooms = {};
const userSockets = new Map(); // userId -> socket.id mapping
const MAX_ROOMS = 1000;
const ROOM_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

// Kullanıcı adı oluştur
const generateGuestName = () => {
  return 'Nobody';
};

// Clean expired rooms every hour
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [roomId, room] of Object.entries(rooms)) {
    if (room.expiresAt < now) {
      // Notify users
      const io = global.io;
      if (io) {
        io.to(roomId).emit('roomClosed', { reason: 'Room expired after 24 hours' });
      }
      delete rooms[roomId];
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    logger.info({
      type: 'ROOM_CLEANUP',
      cleanedCount,
      remainingRooms: Object.keys(rooms).length
    });
  }
}, 60 * 60 * 1000); // Every hour

export default (io, socket) => {
  // Store io globally for cleanup
  if (!global.io) {
    global.io = io;
  }
  
  // Store user socket mapping
  userSockets.set(socket.userId, socket.id);
  
  logger.info({
    type: 'USER_SOCKET_CONNECTED',
    userId: socket.userId,
    socketId: socket.id,
    ip: socket.handshake.address
  });
  // Create a new room
  socket.on('createRoom', async ({ name, password, limit, videoEnabled }, callback) => {
    try {
      // Rate limiting
      await createRoomLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.createRoom, { name, password, limit, videoEnabled });
      if (!validation.valid) {
        logger.warn({
          type: 'VALIDATION_FAILED',
          event: 'createRoom',
          userId: socket.userId,
          errors: validation.errors
        });
        return callback?.({ success: false, message: validation.errors });
      }

      const data = validation.value;

      // Room limit check
      if (Object.keys(rooms).length >= MAX_ROOMS) {
        logger.warn({
          type: 'ROOM_LIMIT_REACHED',
          userId: socket.userId,
          currentRooms: Object.keys(rooms).length
        });
        return callback?.({ success: false, message: 'Server is full, try again later' });
      }

      // Sanitize and validate
      const sanitizedName = sanitizeRoomName(data.name);
      let hashedPassword = null;

      if (data.password) {
        try {
          validatePassword(data.password);
          hashedPassword = await bcrypt.hash(data.password, 10);
        } catch (err) {
          return callback?.({ success: false, message: err.message });
        }
      }

      const roomId = nanoid(8);
      rooms[roomId] = {
        name: sanitizedName,
        passwordHash: hashedPassword,
        limit: Math.min(data.limit, 50),
        videoEnabled: data.videoEnabled,
        ownerId: socket.userId, // Use userId instead of socket.id
        members: {},
        banned: [], // Will store userId instead of socket.id
        createdAt: Date.now(),
        expiresAt: Date.now() + ROOM_TIMEOUT
      };

      rooms[roomId].members[socket.userId] = {
        name: generateGuestName(),
        socketId: socket.id,
        joinedAt: Date.now(),
        inCall: false // Başlangıçta çağrıda değil
      };

      socket.join(roomId);
      
      logger.info({
        type: 'ROOM_CREATED',
        roomId,
        userId: socket.userId,
        name: sanitizedName,
        hasPassword: !!hashedPassword
      });

      io.to(roomId).emit('roomUsers', getUsers(roomId));

      callback?.({ 
        success: true, 
        roomId, 
        room: {
          name: rooms[roomId].name,
          limit: rooms[roomId].limit,
          videoEnabled: rooms[roomId].videoEnabled,
          passwordProtected: !!hashedPassword
        }
      });
    } catch (error) {
      logger.error({
        type: 'CREATE_ROOM_ERROR',
        userId: socket.userId,
        error: error.message
      });
      callback?.({ success: false, message: error.message });
    }
  });

  // Join existing room
  socket.on('joinRoom', async ({ roomId, password }, callback) => {
    try {
      // Rate limiting
      await joinRoomLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.joinRoom, { roomId, password });
      if (!validation.valid) {
        return callback?.({ success: false, message: validation.errors });
      }

      const room = rooms[roomId];
      
      if (!room) {
        logger.warn({
          type: 'ROOM_NOT_FOUND',
          roomId,
          userId: socket.userId
        });
        return callback?.({ success: false, message: 'Room not found' });
      }

      // Check if user is banned (by userId, not socket.id)
      if (room.banned.includes(socket.userId)) {
        logger.warn({
          type: 'BANNED_USER_ATTEMPTED_JOIN',
          roomId,
          userId: socket.userId
        });
        return callback?.({ success: false, message: 'You are banned from this room' });
      }

      // Password check (bcrypt compare)
      if (room.passwordHash) {
        const isPasswordValid = await bcrypt.compare(password || '', room.passwordHash);
        if (!isPasswordValid) {
          logger.warn({
            type: 'INCORRECT_PASSWORD',
            roomId,
            userId: socket.userId
          });
          return callback?.({ success: false, message: 'Incorrect password' });
        }
      }

      // Room capacity check
      if (Object.keys(room.members).length >= room.limit) {
        logger.warn({
          type: 'ROOM_FULL',
          roomId,
          userId: socket.userId,
          currentMembers: Object.keys(room.members).length
        });
        return callback?.({ success: false, message: 'Room is full' });
      }

      // Check if user already in room (reconnection)
      const existingMember = room.members[socket.userId];
      if (existingMember) {
        // Update socket ID for reconnection
        existingMember.socketId = socket.id;
        logger.info({
          type: 'USER_RECONNECTED_TO_ROOM',
          roomId,
          userId: socket.userId,
          previousSocketId: existingMember.socketId,
          newSocketId: socket.id
        });
      } else {
        // ⚠️ DUPLICATE CLEANUP: Aynı odada eski disconnected member'ları temizle
        const duplicateMembers = Object.entries(room.members)
          .filter(([memberId, member]) => 
            memberId !== socket.userId && 
            member.disconnectedAt && 
            Date.now() - member.disconnectedAt < 5000 // Son 5 saniye içinde disconnect olduysa
          );
        
        if (duplicateMembers.length > 0) {
          logger.warn({
            type: 'CLEANING_DUPLICATE_MEMBERS',
            roomId,
            newUserId: socket.userId,
            duplicates: duplicateMembers.map(([id]) => id)
          });
          duplicateMembers.forEach(([memberId]) => {
            delete room.members[memberId];
          });
        }
        
        logger.info({
          type: 'NEW_USER_JOINING_ROOM',
          roomId,
          userId: socket.userId,
          existingMembers: Object.keys(room.members)
        });
        room.members[socket.userId] = {
          name: generateGuestName(),
          socketId: socket.id,
          joinedAt: Date.now(),
          inCall: false // Başlangıçta çağrıda değil
        };
      }

      socket.join(roomId);
      
      logger.info({
        type: 'USER_JOINED_ROOM',
        roomId,
        userId: socket.userId,
        memberCount: Object.keys(room.members).length
      });

      // First send callback with room info
      callback?.({ 
        success: true, 
        room: {
          name: room.name,
          limit: room.limit,
          videoEnabled: room.videoEnabled,
          passwordProtected: !!room.passwordHash
        }
      });

      // Emit roomUsers to ALL users including the one who just joined
      const users = getUsers(roomId);
      io.to(roomId).emit('roomUsers', users);
      
    } catch (error) {
      logger.error({
        type: 'JOIN_ROOM_ERROR',
        roomId,
        userId: socket.userId,
        error: error.message
      });
      callback?.({ success: false, message: error.message });
    }
  });

  // Get room info
  socket.on('getRoomInfo', ({ roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback?.({ success: false, message: 'Room not found' });
    }

    const isOwner = socket.userId === room.ownerId;
    callback?.({
      success: true,
      isOwner,
      name: room.name,
      limit: room.limit,
      videoEnabled: room.videoEnabled,
      passwordProtected: !!room.passwordHash,
      users: getUsers(roomId),
      memberCount: Object.keys(room.members).length
    });
  });

  // Change user name
  socket.on('changeName', async ({ roomId, newName }, callback) => {
    try {
      // Rate limiting
      await changeNameLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.changeName, { roomId, newName });
      if (!validation.valid) {
        return callback?.({ success: false, message: validation.errors });
      }

      const room = rooms[roomId];
      if (!room || !room.members[socket.userId]) {
        return callback?.({ success: false, message: 'Not in room' });
      }

      const sanitized = sanitizeUsername(newName);
      
      if (sanitized.length === 0) {
        return callback?.({ success: false, message: 'Name cannot be empty' });
      }

      room.members[socket.userId].name = sanitized;
      
      logger.info({
        type: 'NAME_CHANGED',
        roomId,
        userId: socket.userId,
        newName: sanitized
      });

      io.to(roomId).emit('roomUsers', getUsers(roomId));
      
      callback?.({ success: true });
    } catch (error) {
      logger.error({
        type: 'CHANGE_NAME_ERROR',
        userId: socket.userId,
        error: error.message
      });
      callback?.({ success: false, message: error.message });
    }
  });

  // Send message
  socket.on('sendMessage', async ({ roomId, message }, callback) => {
    try {
      // Rate limiting
      await messageLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.sendMessage, { roomId, message });
      if (!validation.valid) {
        return callback?.({ success: false, message: validation.errors });
      }

      const room = rooms[roomId];
      if (!room || !room.members[socket.userId]) {
        return callback?.({ success: false, message: 'Not in room' });
      }

      const member = room.members[socket.userId];
      const sanitized = sanitizeMessage(message);

      if (sanitized.length === 0) {
        return callback?.({ success: false, message: 'Message cannot be empty' });
      }

      const msg = {
        id: nanoid(6),
        from: socket.userId,
        name: member.name,
        content: sanitized,
        role: room.ownerId === socket.userId ? 'owner' : 'member',
        timestamp: new Date().toISOString()
      };

      logger.info({
        type: 'MESSAGE_SENT',
        roomId,
        userId: socket.userId,
        messageLength: sanitized.length
      });

      io.to(roomId).emit('receiveMessage', msg);
      callback?.({ success: true });
    } catch (error) {
      logger.error({
        type: 'SEND_MESSAGE_ERROR',
        userId: socket.userId,
        error: error.message
      });
      callback?.({ success: false, message: error.message });
    }
  });

  // Kick user (owner only)
  socket.on('kickUser', ({ roomId, targetUserId }, callback) => {
    try {
      // Validation
      const validation = validate(schemas.kickUser, { roomId, targetUserId });
      if (!validation.valid) {
        return callback?.({ success: false, message: validation.errors });
      }

      const room = rooms[roomId];
      if (!room) {
        return callback?.({ success: false, message: 'Room not found' });
      }
      
      if (room.ownerId !== socket.userId) {
        logger.warn({
          type: 'UNAUTHORIZED_KICK',
          roomId,
          userId: socket.userId,
          targetUserId
        });
        return callback?.({ success: false, message: 'Not authorized' });
      }

      const target = room.members[targetUserId];
      if (!target) {
        return callback?.({ success: false, message: 'User not found' });
      }

      // Ban by userId (persistent across reconnections)
      room.banned.push(targetUserId);
      delete room.members[targetUserId];

      // Find target's current socket
      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.leave(roomId);
          targetSocket.emit('kicked', { roomId, reason: 'Kicked by room owner' });
        }
      }

      logger.info({
        type: 'USER_KICKED',
        roomId,
        ownerId: socket.userId,
        targetUserId
      });

      io.to(roomId).emit('roomUsers', getUsers(roomId));
      callback?.({ success: true });
    } catch (error) {
      logger.error({
        type: 'KICK_USER_ERROR',
        userId: socket.userId,
        error: error.message
      });
      callback?.({ success: false, message: 'Failed to kick user' });
    }
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (room?.members[socket.userId]) {
      delete room.members[socket.userId];
      socket.leave(roomId);
      
      logger.info({
        type: 'USER_LEFT_ROOM',
        roomId,
        userId: socket.userId
      });

      io.to(roomId).emit('roomUsers', getUsers(roomId));
      socket.to(roomId).emit('userLeft', { userId: socket.userId });

      // Close room if empty
      if (Object.keys(room.members).length === 0) {
        io.to(roomId).emit('roomClosed', { reason: 'Room empty' });
        delete rooms[roomId];
        logger.info({
          type: 'ROOM_CLOSED',
          roomId,
          reason: 'empty'
        });
      }
    }
  });

  // ===== Call Join/Leave Events =====

  // Join call - Kullanıcı çağrıya katıldı
  socket.on('join-call', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.members[socket.userId]) {
      return;
    }

    // Kullanıcıyı çağrıda olarak işaretle
    room.members[socket.userId].inCall = true;

    logger.info({
      type: 'USER_JOINED_CALL',
      roomId,
      userId: socket.userId,
      userName: room.members[socket.userId].name
    });

    // Tüm odaya bildir
    io.to(roomId).emit('roomUsers', getUsers(roomId));
    
    // Çağrıya katıldığını bildir (WebRTC için)
    socket.to(roomId).emit('user-joined-call', { 
      userId: socket.userId 
    });
  });

  // Leave call - Kullanıcı çağrıdan ayrıldı
  socket.on('leave-call', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || !room.members[socket.userId]) {
      return;
    }

    // Kullanıcıyı çağrıda değil olarak işaretle
    room.members[socket.userId].inCall = false;

    logger.info({
      type: 'USER_LEFT_CALL',
      roomId,
      userId: socket.userId,
      userName: room.members[socket.userId].name
    });

    // Tüm odaya bildir
    io.to(roomId).emit('roomUsers', getUsers(roomId));
    
    // Çağrıdan ayrıldığını bildir
    socket.to(roomId).emit('user-left-call', { 
      userId: socket.userId 
    });
  });

  // ===== WebRTC Signaling Events with Security =====
  
  // Offer (bağlantı teklifi)
  socket.on('webrtc-offer', async ({ to, offer, roomId }) => {
    try {
      // Rate limiting
      await webrtcLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.webrtcSignaling, { to, offer, roomId });
      if (!validation.valid) {
        logger.warn({
          type: 'WEBRTC_VALIDATION_FAILED',
          event: 'offer',
          userId: socket.userId,
          errors: validation.errors
        });
        return socket.emit('error', { message: 'Invalid signaling data' });
      }

      const room = rooms[roomId];
      
      // Security checks
      if (!room) {
        return socket.emit('error', { message: 'Room not found' });
      }
      
      if (!room.members[socket.userId]) {
        logger.warn({
          type: 'WEBRTC_UNAUTHORIZED',
          event: 'offer',
          userId: socket.userId,
          roomId
        });
        return socket.emit('error', { message: 'Not in room' });
      }
      
      if (!room.members[to]) {
        logger.warn({
          type: 'WEBRTC_TARGET_NOT_IN_ROOM',
          event: 'offer',
          from: socket.userId,
          to,
          roomId
        });
        return socket.emit('error', { message: 'Target user not in room' });
      }

      // Get target socket
      const targetSocketId = userSockets.get(to);
      if (!targetSocketId) {
        return socket.emit('error', { message: 'User offline' });
      }

      logger.info({
        type: 'WEBRTC_OFFER',
        from: socket.userId,
        to,
        roomId
      });

      io.to(targetSocketId).emit('webrtc-offer', {
        from: socket.userId,
        offer,
        roomId
      });
    } catch (error) {
      logger.error({
        type: 'WEBRTC_OFFER_ERROR',
        userId: socket.userId,
        error: error.message
      });
      socket.emit('error', { message: error.message });
    }
  });

  // Answer (bağlantı kabulü)
  socket.on('webrtc-answer', async ({ to, answer, roomId }) => {
    try {
      // Rate limiting
      await webrtcLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.webrtcSignaling, { to, answer, roomId });
      if (!validation.valid) {
        return socket.emit('error', { message: 'Invalid signaling data' });
      }

      const room = rooms[roomId];
      
      if (!room || !room.members[socket.userId] || !room.members[to]) {
        logger.warn({
          type: 'WEBRTC_INVALID_ANSWER',
          from: socket.userId,
          to,
          roomId
        });
        return socket.emit('error', { message: 'Invalid signaling' });
      }

      const targetSocketId = userSockets.get(to);
      if (!targetSocketId) {
        return socket.emit('error', { message: 'User offline' });
      }

      logger.info({
        type: 'WEBRTC_ANSWER',
        from: socket.userId,
        to,
        roomId
      });

      io.to(targetSocketId).emit('webrtc-answer', {
        from: socket.userId,
        answer
      });
    } catch (error) {
      logger.error({
        type: 'WEBRTC_ANSWER_ERROR',
        userId: socket.userId,
        error: error.message
      });
      socket.emit('error', { message: error.message });
    }
  });

  // ICE Candidate (NAT geçiş bilgisi)
  socket.on('ice-candidate', async ({ to, candidate, roomId }) => {
    try {
      // Rate limiting
      await webrtcLimiter.consume(socket.userId);

      // Validation
      const validation = validate(schemas.webrtcSignaling, { to, candidate, roomId });
      if (!validation.valid) {
        return socket.emit('error', { message: 'Invalid signaling data' });
      }

      const room = rooms[roomId];
      
      if (!room || !room.members[socket.userId] || !room.members[to]) {
        return socket.emit('error', { message: 'Invalid signaling' });
      }

      const targetSocketId = userSockets.get(to);
      if (!targetSocketId) {
        return socket.emit('error', { message: 'User offline' });
      }

      logger.debug({
        type: 'WEBRTC_ICE_CANDIDATE',
        from: socket.userId,
        to
      });

      io.to(targetSocketId).emit('ice-candidate', {
        from: socket.userId,
        candidate
      });
    } catch (error) {
      logger.error({
        type: 'WEBRTC_ICE_ERROR',
        userId: socket.userId,
        error: error.message
      });
      // Don't emit error for ICE failures (too noisy)
    }
  });

  // Arama bitti
  socket.on('end-call', ({ roomId }) => {
    logger.info({
      type: 'CALL_ENDED',
      userId: socket.userId,
      roomId
    });

    socket.to(roomId).emit('call-ended', {
      from: socket.userId
    });
  });

  // ===== Socket Audio Events =====

  // Audio data - Ses verisini ODADAKİ BÜTÜN KULLANICILARA ilet
  socket.on('audio-data', ({ roomId, audioData }) => {
    const room = rooms[roomId];
    
    // Güvenlik kontrolleri
    if (!room || !room.members[socket.userId]) {
      return; // Odada değilse ses verisi gönderme
    }

    // ❗ ÖNEMLI: Çağrıda olup olmama kontrolü YOK
    // Odadaki BÜTÜN kullanıcılara (kendisi hariç) gönder
    const allOtherUsers = Object.keys(room.members).filter(
      userId => userId !== socket.userId
    );

    console.log(`🔊 Ses dağıtımı: ${socket.userId} → ${allOtherUsers.length} kullanıcı (tüm oda)`);

    allOtherUsers.forEach(targetUserId => {
      const targetSocketId = userSockets.get(targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('audio-data', {
          userId: socket.userId,
          audioData
        });
      }
    });
  });

  // ===== End Socket Audio Events =====

  // ===== End WebRTC Signaling =====

  // Handle disconnect
  socket.on('disconnect', () => {
    logger.info({
      type: 'USER_DISCONNECTED',
      userId: socket.userId,
      socketId: socket.id
    });

    // Remove from socket mapping
    userSockets.delete(socket.userId);

    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.members[socket.userId]) {
        // Don't delete member immediately (allow reconnection)
        // Just mark as disconnected
        room.members[socket.userId].disconnectedAt = Date.now();
        
        io.to(roomId).emit('userLeft', { userId: socket.userId });

        // Clean up after 5 minutes of disconnection
        setTimeout(() => {
          const member = rooms[roomId]?.members[socket.userId];
          if (member?.disconnectedAt && Date.now() - member.disconnectedAt > 5 * 60 * 1000) {
            delete rooms[roomId]?.members[socket.userId];
            
            if (rooms[roomId] && Object.keys(rooms[roomId].members).length === 0) {
              io.to(roomId).emit('roomClosed', { reason: 'Room empty' });
              delete rooms[roomId];
              logger.info({
                type: 'ROOM_CLOSED',
                roomId,
                reason: 'empty_after_disconnect'
              });
            } else if (rooms[roomId]) {
              io.to(roomId).emit('roomUsers', getUsers(roomId));
            }
          }
        }, 5 * 60 * 1000);
      }
    }
  });

  // Helper function
  function getUsers(roomId) {
    const room = rooms[roomId];
    if (!room) return [];
    
    const activeUsers = Object.entries(room.members)
      .filter(([_, member]) => !member.disconnectedAt) // Only active users
      .map(([userId, member]) => ({
        id: userId,
        name: member.name,
        role: userId === room.ownerId ? 'owner' : 'member',
        inCall: member.inCall || false // Çağrıda olup olmadığı
      }));
    
    // ⚠️ DEBUG: Log active users
    if (activeUsers.length > 1) {
      logger.warn({
        type: 'MULTIPLE_USERS_IN_ROOM',
        roomId,
        count: activeUsers.length,
        userIds: activeUsers.map(u => ({ id: u.id, name: u.name, inCall: u.inCall })),
        allMembers: Object.keys(room.members).map(userId => ({
          userId,
          disconnectedAt: room.members[userId].disconnectedAt,
          socketId: room.members[userId].socketId
        }))
      });
    }
    
    return activeUsers;
  }
};
