const express = require('express');
const router = express.Router();
const {
  createReview,
  getWorkerReviews,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

router.post('/tickets/:id', validateObjectId('id'), authorize('customer'), createReview);
router.get('/workers/:id', validateObjectId('id'), getWorkerReviews);

module.exports = router;
