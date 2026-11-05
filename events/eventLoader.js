import roomEvents from './room.js';
import webrtcEvents from './webrtc.js';

export default (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Load room events
    roomEvents(io, socket);
    
    // Load WebRTC signaling events
    webrtcEvents(io, socket);

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};
