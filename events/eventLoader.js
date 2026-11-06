import roomEvents from './room.js';

export default (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Load room events (includes WebRTC signaling)
    roomEvents(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
