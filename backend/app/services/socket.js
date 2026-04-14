const socketIo = require('socket.io');

let io;

module.exports = {
  init: (httpServer, corsOptions) => {
    io = socketIo(httpServer, {
      cors: corsOptions
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Clients join a room based on their user ID to receive private notifications
      socket.on('join', (userId) => {
        if (userId) {
          socket.join(userId);
          console.log(`Socket ${socket.id} joined room ${userId}`);
        }
      });

      // Admins join an 'admin' room to receive all admin notifications
      socket.on('join_admin', () => {
        socket.join('admin');
        console.log(`Socket ${socket.id} joined room admin`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
