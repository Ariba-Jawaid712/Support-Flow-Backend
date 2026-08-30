const express = require('express');
const router = express.Router();
const {
  createTicket,
  getCustomerTickets,
  getTicketById,
  getAllTickets,
} = require('../controllers/ticketController');
const { createReview } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

router.post('/', authorize('customer'), createTicket);
router.get('/my-requests', authorize('customer'), getCustomerTickets);
router.get('/all', authorize('admin'), getAllTickets);
router.get('/:id', validateObjectId('id'), getTicketById);
router.post('/:id/review', validateObjectId('id'), authorize('customer'), createReview);

module.exports = router;
