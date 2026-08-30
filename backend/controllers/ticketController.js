const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { analyzeTicket } = require('../services/aiTriageService');
const { createNotification } = require('../services/notificationService');

// Helper to generate a unique ticket identifier
const generateTicketNumber = async () => {
  const count = await Ticket.countDocuments();
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `SF-${1000 + count + 1}-${randomSuffix}`;
};

// @desc    Create a new support/service request (Customer)
// @route   POST /api/tickets
// @access  Private (Customer)
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, category } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both subject and description for the request.',
      });
    }

    // Run deterministic local AI triage
    const triageResult = analyzeTicket(subject, description);

    const ticketNumber = await generateTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      customer: req.user._id,
      subject: subject.trim(),
      description: description.trim(),
      category: category && category !== 'General' ? category : triageResult.category,
      priority: triageResult.priority,
      status: 'Pending',
      aiTriage: triageResult,
      statusHistory: [
        {
          status: 'Pending',
          changedBy: req.user._id,
          note: 'Request created and triaged',
          timestamp: new Date(),
        },
      ],
    });

    // Notify approved workers about the new incoming request
    const approvedWorkers = await User.find({ role: 'worker', workerApprovalStatus: 'Approved', isActive: true });
    for (const worker of approvedWorkers) {
      await createNotification({
        recipient: worker._id,
        ticket: ticket._id,
        type: 'ticket_created',
        title: 'New Service Request Available',
        message: `A new request "${ticket.subject}" (${ticket.priority} priority) is available for acceptance.`,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Support request created successfully.',
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all requests created by the authenticated customer
// @route   GET /api/tickets/my-requests
// @access  Private (Customer)
const getCustomerTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ customer: req.user._id })
      .populate('assignedWorker', 'name email workerBio workerSkills')
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

// @desc    Get single ticket details with authorization check
// @route   GET /api/tickets/:id
// @access  Private (Customer, Worker, Admin)
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('assignedWorker', 'name email workerBio workerSkills')
      .populate('statusHistory.changedBy', 'name role');

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    // Authorization checks
    const userId = req.user._id.toString();
    const isOwner = ticket.customer && ticket.customer._id.toString() === userId;
    const isAssigned = ticket.assignedWorker && ticket.assignedWorker._id.toString() === userId;
    const isWorkerLookingAtAvailable = req.user.role === 'worker' && ticket.status === 'Pending';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssigned && !isWorkerLookingAtAvailable && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this request.',
      });
    }

    res.status(200).json({
      success: true,
      ticket,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all tickets across platform (Admin)
// @route   GET /api/tickets/all
// @access  Private (Admin)
const getAllTickets = async (req, res, next) => {
  try {
    const { status, priority, category } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const tickets = await Ticket.find(filter)
      .populate('customer', 'name email')
      .populate('assignedWorker', 'name email')
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

module.exports = {
  createTicket,
  getCustomerTickets,
  getTicketById,
  getAllTickets,
};
