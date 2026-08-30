const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const { createNotification } = require('../services/notificationService');

// @desc    Submit a review for a resolved request
// @route   POST /api/tickets/:id/review
// @access  Private (Customer - Owner only)
const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const ticketId = req.params.id;

    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5 stars.',
      });
    }

    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Request ticket not found.',
      });
    }

    // Customer ownership verification
    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the customer who created this request can submit a review.',
      });
    }

    // Strict status rule: review only allowed when Resolved
    if (ticket.status !== 'Resolved') {
      return res.status(400).json({
        success: false,
        message: `Reviews can only be submitted once the request is Resolved. Current status: ${ticket.status}.`,
      });
    }

    if (!ticket.assignedWorker) {
      return res.status(400).json({
        success: false,
        message: 'This request does not have an assigned worker to review.',
      });
    }

    // Verify duplicate review restriction
    const existingReview = await Review.findOne({
      customer: req.user._id,
      ticket: ticket._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this request. Duplicate reviews are not permitted.',
      });
    }

    const review = await Review.create({
      customer: req.user._id,
      worker: ticket.assignedWorker,
      ticket: ticket._id,
      rating: Number(rating),
      comment: comment ? comment.trim() : '',
    });

    // Notify the assigned worker
    await createNotification({
      recipient: ticket.assignedWorker,
      ticket: ticket._id,
      type: 'system_alert',
      title: 'New Customer Review Received',
      message: `Customer ${req.user.name} rated your service ${rating}/5 stars for ticket "${ticket.subject}".`,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      review,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all reviews for a worker
// @route   GET /api/workers/:id/reviews
// @access  Private
const getWorkerReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ worker: req.params.id })
      .populate('customer', 'name')
      .populate('ticket', 'ticketNumber subject')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      reviews,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReview,
  getWorkerReviews,
};
