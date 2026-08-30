const express = require('express');
const router = express.Router();
const {
  getTicketMessages,
  sendMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

router.get('/ticket/:ticketId', validateObjectId('ticketId'), getTicketMessages);
router.post('/ticket/:ticketId', validateObjectId('ticketId'), sendMessage);

module.exports = router;
