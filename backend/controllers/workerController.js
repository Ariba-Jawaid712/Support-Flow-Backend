const Ticket = require('../models/Ticket');
const Review = require('../models/Review');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');

// Valid forward transitions in the strict one-way state machine
const VALID_STATUS_TRANSITIONS = {
  Pending: ['Accepted', 'Rejected'],
  Accepted: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: [], // Finalized state
  Rejected: [], // Finalized state
};

// @desc    Get requests available for worker acceptance
// @route   GET /api/workers/available
// @access  Private (Approved Worker)
const getAvailableRequests = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({
      status: 'Pending',
      assignedWorker: null,
    })
      .populate('customer', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get requests assigned to the logged-in worker
// @route   GET /api/workers/my-requests
// @access  Private (Approved Worker)
const getMyAcceptedRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { assignedWorker: req.user._id };

    if (status) {
      filter.status = status;
    }

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Worker accepts a pending customer request
// @route   POST /api/workers/requests/:id/accept
// @access  Private (Approved Worker)
const acceptRequest = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    if (ticket.status !== 'Pending' || ticket.assignedWorker) {
      return res.status(400).json({
        success: false,
        message: 'This request is no longer pending or has already been accepted by another worker.',
      });
    }

    ticket.assignedWorker = req.user._id;
    ticket.status = 'Accepted';
    ticket.acceptedAt = new Date();
    ticket.statusHistory.push({
      status: 'Accepted',
      changedBy: req.user._id,
      note: `Request accepted by Worker ${req.user.name}`,
      timestamp: new Date(),
    });

    await ticket.save();

    // Broadcast real-time Socket.IO event & notify Customer
    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`ticket_${ticket._id.toString()}`).emit('ticket-accepted', {
        ticketId: ticket._id,
        worker: { id: req.user._id, name: req.user.name },
      });
    }

    await createNotification({
      recipient: ticket.customer,
      ticket: ticket._id,
      type: 'ticket_accepted',
      title: 'Request Accepted',
      message: `Worker ${req.user.name} has accepted your request: "${ticket.subject}".`,
    });

    res.status(200).json({
      success: true,
      message: 'Request successfully accepted.',
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Worker rejects a pending customer request
// @route   POST /api/workers/requests/:id/reject
// @access  Private (Approved Worker)
const rejectRequest = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    if (ticket.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status '${ticket.status}'. Only pending requests can be rejected.`,
      });
    }

    ticket.status = 'Rejected';
    ticket.rejectedAt = new Date();
    ticket.statusHistory.push({
      status: 'Rejected',
      changedBy: req.user._id,
      note: `Request rejected by Worker ${req.user.name}`,
      timestamp: new Date(),
    });

    await ticket.save();

    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`ticket_${ticket._id.toString()}`).emit('ticket-rejected', {
        ticketId: ticket._id,
      });
    }

    await createNotification({
      recipient: ticket.customer,
      ticket: ticket._id,
      type: 'ticket_rejected',
      title: 'Request Not Accepted',
      message: `Your request "${ticket.subject}" could not be accepted at this time.`,
    });

    res.status(200).json({
      success: true,
      message: 'Request marked as rejected.',
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update request status according to strict one-way state machine
// @route   PUT /api/workers/requests/:id/status
// @access  Private (Approved Worker)
const updateStatus = async (req, res, next) => {
  try {
    const { nextStatus, note } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    // Verify Worker assignment
    if (!ticket.assignedWorker || ticket.assignedWorker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the assigned worker for this request.',
      });
    }

    const currentStatus = ticket.status;
    const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${currentStatus}' to '${nextStatus}'. Allowed transitions: ${
          allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'None (finalized status)'
        }.`,
      });
    }

    ticket.status = nextStatus;
    if (nextStatus === 'Resolved') {
      ticket.resolvedAt = new Date();
    }

    ticket.statusHistory.push({
      status: nextStatus,
      changedBy: req.user._id,
      note: note || `Status transitioned to ${nextStatus}`,
      timestamp: new Date(),
    });

    await ticket.save();

    // Socket.IO event emission
    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`ticket_${ticket._id.toString()}`).emit('ticket-status-updated', {
        ticketId: ticket._id,
        status: nextStatus,
      });

      if (nextStatus === 'Resolved') {
        activeIo.to(`ticket_${ticket._id.toString()}`).emit('ticket-resolved', {
          ticketId: ticket._id,
        });
      }
    }

    // Customer Notification
    let notifTitle = `Request Status Updated: ${nextStatus}`;
    let notifMsg = `Your request "${ticket.subject}" is now ${nextStatus}.`;
    let notifType = 'ticket_status_updated';

    if (nextStatus === 'Resolved') {
      notifTitle = 'Request Completed & Resolved';
      notifMsg = `Your request "${ticket.subject}" has been marked as Resolved. Please leave a 5-star rating and review!`;
      notifType = 'ticket_resolved';
    }

    await createNotification({
      recipient: ticket.customer,
      ticket: ticket._id,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
    });

    res.status(200).json({
      success: true,
      message: `Request status updated to ${nextStatus}.`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Worker updates operational priority
// @route   PUT /api/workers/requests/:id/priority
// @access  Private (Approved Worker)
const updatePriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    const allowedPriorities = ['Low', 'Medium', 'High', 'Critical', 'Urgent'];

    if (!priority || !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: `Invalid priority value. Must be one of: ${allowedPriorities.join(', ')}`,
      });
    }

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    // Ensure only the assigned worker can change priority
    if (!ticket.assignedWorker || ticket.assignedWorker.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned worker can change the operational priority of this request.',
      });
    }

    const previousPriority = ticket.priority;
    ticket.priority = priority;
    await ticket.save();

    // Broadcast Socket.IO event
    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`ticket_${ticket._id.toString()}`).emit('ticket-priority-updated', {
        ticketId: ticket._id,
        priority,
      });
    }

    // Notify customer about priority change
    await createNotification({
      recipient: ticket.customer,
      ticket: ticket._id,
      type: 'ticket_priority_updated',
      title: 'Priority Updated',
      message: `Worker changed your request priority from ${previousPriority} to ${priority}.`,
    });

    res.status(200).json({
      success: true,
      message: `Request priority updated to ${priority}.`,
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get worker dashboard statistics (including aggregated ratings)
// @route   GET /api/workers/stats
// @access  Private (Approved Worker)
const getWorkerStats = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const [availableCount, acceptedCount, inProgressCount, resolvedCount, highCriticalCount] =
      await Promise.all([
        Ticket.countDocuments({ status: 'Pending', assignedWorker: null }),
        Ticket.countDocuments({ assignedWorker: workerId, status: 'Accepted' }),
        Ticket.countDocuments({ assignedWorker: workerId, status: 'In Progress' }),
        Ticket.countDocuments({ assignedWorker: workerId, status: 'Resolved' }),
        Ticket.countDocuments({
          assignedWorker: workerId,
          priority: { $in: ['High', 'Critical', 'Urgent'] },
          status: { $nin: ['Resolved', 'Rejected'] },
        }),
      ]);

    // Calculate real average rating and review count from MongoDB Review collection
    const reviewStats = await Review.aggregate([
      { $match: { worker: workerId } },
      {
        $group: {
          _id: '$worker',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = reviewStats.length > 0 ? Number(reviewStats[0].averageRating.toFixed(1)) : 0;
    const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      stats: {
        availableRequests: availableCount,
        acceptedRequests: acceptedCount,
        inProgressRequests: inProgressCount,
        resolvedRequests: resolvedCount,
        highPriorityRequests: highCriticalCount,
        averageRating,
        totalReviews,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get worker public profile & reviews
// @route   GET /api/workers/:id/profile
// @access  Private
const getWorkerProfile = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id).select('name email role workerBio workerSkills createdAt');

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found.',
      });
    }

    const reviews = await Review.find({ worker: worker._id })
      .populate('customer', 'name')
      .populate('ticket', 'ticketNumber subject')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      worker,
      reviews,
      averageRating,
      totalReviews,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailableRequests,
  getMyAcceptedRequests,
  acceptRequest,
  rejectRequest,
  updateStatus,
  updatePriority,
  getWorkerStats,
  getWorkerProfile,
};
