const Notification = require('../models/Notification');

/**
 * Creates and persists a notification in MongoDB, then broadcasts it via Socket.IO
 */
const createNotification = async ({ recipient, ticket = null, type, title, message, io = null }) => {
  try {
    const notification = await Notification.create({
      recipient,
      ticket,
      type,
      title,
      message,
    });

    const activeIo = io || global.io;
    if (activeIo) {
      activeIo.to(`user_${recipient.toString()}`).emit('notification-created', notification);
    }

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
