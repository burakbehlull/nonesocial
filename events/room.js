import { nanoid } from 'nanoid';

const rooms = {};

export default (io, socket) => {
  // Create a new room
  socket.on('createRoom', ({ name, password, limit, videoEnabled }, callback) => {
    const roomId = nanoid(8);
    rooms[roomId] = {
      name: name || 'Unnamed Room',
      password: password || null,
      limit: limit || 10,
      videoEnabled: videoEnabled !== false,
      ownerId: socket.id,
      members: {},
      banned: [],
      createdAt: new Date().toISOString()
    };

    rooms[roomId].members[socket.id] = {
      name: 'Guest',
      joinedAt: new Date().toISOString()
    };

    socket.join(roomId);
    io.to(roomId).emit('roomUsers', getUsers(roomId));

    callback({ success: true, roomId, room: rooms[roomId] });
  });

  // Join existing room
  socket.on('joinRoom', ({ roomId, password }, callback) => {
    const room = rooms[roomId];
    
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }

    if (room.banned.includes(socket.id)) {
      return callback({ success: false, message: 'You are banned from this room' });
    }

    if (room.password && room.password !== password) {
      return callback({ success: false, message: 'Incorrect password' });
    }

    if (Object.keys(room.members).length >= room.limit) {
      return callback({ success: false, message: 'Room is full' });
    }

    room.members[socket.id] = {
      name: 'Guest',
      joinedAt: new Date().toISOString()
    };

    socket.join(roomId);
    callback({ success: true, room });

    // Notify others about updated user list
    io.to(roomId).emit('roomUsers', getUsers(roomId));
  });

  // Get room info
  socket.on('getRoomInfo', ({ roomId }, callback) => {
    const room = rooms[roomId];
    if (!room) {
      return callback({ success: false, message: 'Room not found' });
    }

    const isOwner = socket.id === room.ownerId;
    callback({
      success: true,
      isOwner,
      name: room.name,
      limit: room.limit,
      videoEnabled: room.videoEnabled,
      passwordProtected: !!room.password,
      users: getUsers(roomId),
      memberCount: Object.keys(room.members).length
    });
  });

  // Change user name
  socket.on('changeName', ({ roomId, newName }, callback) => {
    const room = rooms[roomId];
    if (!room || !room.members[socket.id]) {
      return callback?.({ success: false, message: 'Not in room' });
    }

    if (!newName || newName.trim().length === 0) {
      return callback?.({ success: false, message: 'Name cannot be empty' });
    }

    if (newName.length > 20) {
      return callback?.({ success: false, message: 'Name too long (max 20)' });
    }

    room.members[socket.id].name = newName.trim();
    io.to(roomId).emit('roomUsers', getUsers(roomId));
    
    callback?.({ success: true });
  });

  // Send message
  socket.on('sendMessage', ({ roomId, message }, callback) => {
    const room = rooms[roomId];
    if (!room || !room.members[socket.id]) {
      return callback?.({ success: false, message: 'Not in room' });
    }

    const member = room.members[socket.id];
    const msg = {
      id: nanoid(6),
      from: socket.id,
      name: member.name,
      content: message,
      role: room.ownerId === socket.id ? 'owner' : 'member',
      timestamp: new Date().toISOString()
    };

    io.to(roomId).emit('receiveMessage', msg);
    callback?.({ success: true });
  });

  // Kick user (owner only)
  socket.on('kickUser', ({ roomId, targetSocketId }, callback) => {
    const room = rooms[roomId];
    if (!room) return callback?.({ success: false, message: 'Room not found' });
    
    if (room.ownerId !== socket.id) {
      return callback?.({ success: false, message: 'Not authorized' });
    }

    const target = room.members[targetSocketId];
    if (!target) return callback?.({ success: false, message: 'User not found' });

    room.banned.push(targetSocketId);
    delete room.members[targetSocketId];

    const targetSocket = io.sockets.sockets.get(targetSocketId);
    if (targetSocket) {
      targetSocket.leave(roomId);
      targetSocket.emit('kicked', { roomId });
    }

    io.to(roomId).emit('roomUsers', getUsers(roomId));
    callback?.({ success: true });
  });

  // Leave room
  socket.on('leaveRoom', ({ roomId }) => {
    const room = rooms[roomId];
    if (room?.members[socket.id]) {
      delete room.members[socket.id];
      socket.leave(roomId);
      
      io.to(roomId).emit('roomUsers', getUsers(roomId));
      socket.to(roomId).emit('userLeft', { userId: socket.id });

      // Close room if empty
      if (Object.keys(room.members).length === 0) {
        io.to(roomId).emit('roomClosed');
        delete rooms[roomId];
      }
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      const room = rooms[roomId];
      if (room.members[socket.id]) {
        delete room.members[socket.id];
        io.to(roomId).emit('roomUsers', getUsers(roomId));
        io.to(roomId).emit('userLeft', { userId: socket.id });

        if (Object.keys(room.members).length === 0) {
          io.to(roomId).emit('roomClosed');
          delete rooms[roomId];
        }
      }
    }
  });

  // Helper function
  function getUsers(roomId) {
    const room = rooms[roomId];
    if (!room) return [];
    
    return Object.entries(room.members).map(([id, member]) => ({
      id,
      name: member.name,
      role: id === room.ownerId ? 'owner' : 'member'
    }));
  }
};
