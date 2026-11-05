export default (io, socket) => {
  
  // User wants to start video/audio call
  socket.on('call-user', ({ roomId, to, signal }) => {
    io.to(to).emit('incoming-call', {
      from: socket.id,
      signal
    });
  });

  // Answer call
  socket.on('answer-call', ({ to, signal }) => {
    io.to(to).emit('call-answered', {
      from: socket.id,
      signal
    });
  });

  // ICE candidate exchange
  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate
    });
  });

  // User toggled video
  socket.on('toggle-video', ({ roomId, enabled }) => {
    socket.to(roomId).emit('user-toggled-video', {
      userId: socket.id,
      enabled
    });
  });

  // User toggled audio
  socket.on('toggle-audio', ({ roomId, enabled }) => {
    socket.to(roomId).emit('user-toggled-audio', {
      userId: socket.id,
      enabled
    });
  });

  // User ended call
  socket.on('end-call', ({ roomId, to }) => {
    if (to) {
      io.to(to).emit('call-ended', { from: socket.id });
    } else {
      socket.to(roomId).emit('call-ended', { from: socket.id });
    }
  });
};
