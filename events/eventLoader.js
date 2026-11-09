import roomEvents from './room.js';

export default (io) => {
  io.on('connection', async (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Load room events (includes WebRTC signaling)
    await roomEvents(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
