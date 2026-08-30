const Message = require('../models/Message');
const Ticket = require('../models/Ticket');
const { createNotification } = require('../services/notificationService');

// @desc    Get all messages for a ticket conversation
// @route   GET /api/messages/ticket/:ticketId
// @access  Private
const getTicketMessages = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    const userId = req.user._id.toString();
    const isOwner = ticket.customer.toString() === userId;
    const isAssigned = ticket.assignedWorker && ticket.assignedWorker.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view the conversation for this ticket.',
      });
    }

    const messages = await Message.find({ ticket: ticketId })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message in a ticket conversation
// @route   POST /api/messages/ticket/:ticketId
// @access  Private
const sendMessage = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message text cannot be empty.',
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    const userId = req.user._id.toString();
    const isOwner = ticket.customer.toString() === userId;
    const isAssigned = ticket.assignedWorker && ticket.assignedWorker.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    // Enforcement: Customer can message only their own; Worker only assigned; Admin can message
    if (!isOwner && !isAssigned && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to post messages to this request.',
      });
    }

    const newMsg = await Message.create({
      ticket: ticketId,
      sender: req.user._id,
      senderRole: req.user.role,
      message: message.trim(),
    });

    const populatedMsg = await Message.findById(newMsg._id).populate('sender', 'name role');

    // Broadcast in real-time to ticket room via Socket.IO
    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`ticket_${ticketId}`).emit('new-message', populatedMsg);
    }

    // Determine recipient for notification
    let recipientId = null;
    if (isOwner && ticket.assignedWorker) {
      recipientId = ticket.assignedWorker;
    } else if (isAssigned) {
      recipientId = ticket.customer;
    }

    if (recipientId) {
      await createNotification({
        recipient: recipientId,
        ticket: ticket._id,
        type: 'new_message',
        title: `New message on ${ticket.ticketNumber}`,
        message: `${req.user.name}: "${message.trim().slice(0, 80)}${message.length > 80 ? '...' : ''}"`,
      });
    }

    res.status(201).json({
      success: true,
      message: populatedMsg,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTicketMessages,
  sendMessage,
};
