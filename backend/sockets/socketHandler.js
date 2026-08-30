const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication token required for Socket connection'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supportflow_super_secret_jwt_key_2026_secure'
      );

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return next(new Error('User not found or deactivated'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Socket authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[Socket] User connected: ${socket.user.name} (${userId}) - Role: ${socket.user.role}`);

    // Join user-specific private room for direct notifications
    socket.join(`user_${userId}`);

    // Join ticket-specific room for live conversation & status updates
    socket.on('join-ticket', ({ ticketId }) => {
      if (ticketId) {
        socket.join(`ticket_${ticketId}`);
        console.log(`[Socket] ${socket.user.name} joined ticket room: ticket_${ticketId}`);
      }
    });

    // Leave ticket-specific room
    socket.on('leave-ticket', ({ ticketId }) => {
      if (ticketId) {
        socket.leave(`ticket_${ticketId}`);
        console.log(`[Socket] ${socket.user.name} left ticket room: ticket_${ticketId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user.name} (${userId})`);
    });
  });
};

module.exports = initSocket;
