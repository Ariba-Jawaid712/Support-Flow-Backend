const express = require('express');
const router = express.Router();
const {
  getAvailableRequests,
  getMyAcceptedRequests,
  acceptRequest,
  rejectRequest,
  updateStatus,
  updatePriority,
  getWorkerStats,
  getWorkerProfile,
} = require('../controllers/workerController');
const { getWorkerReviews } = require('../controllers/reviewController');
const { protect, authorize, requireApprovedWorker } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);

// Publicly accessible to authenticated users
router.get('/:id/profile', validateObjectId('id'), getWorkerProfile);
router.get('/:id/reviews', validateObjectId('id'), getWorkerReviews);

// Worker-specific routes
router.get('/available', authorize('worker'), requireApprovedWorker, getAvailableRequests);
router.get('/my-requests', authorize('worker'), requireApprovedWorker, getMyAcceptedRequests);
router.get('/stats', authorize('worker'), requireApprovedWorker, getWorkerStats);

router.post('/requests/:id/accept', validateObjectId('id'), authorize('worker'), requireApprovedWorker, acceptRequest);
router.post('/requests/:id/reject', validateObjectId('id'), authorize('worker'), requireApprovedWorker, rejectRequest);
router.put('/requests/:id/status', validateObjectId('id'), authorize('worker'), requireApprovedWorker, updateStatus);
router.put('/requests/:id/priority', validateObjectId('id'), authorize('worker'), requireApprovedWorker, updatePriority);

module.exports = router;
