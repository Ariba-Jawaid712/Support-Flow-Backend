const express = require('express');
const router = express.Router();
const {
  getStats,
  getWorkerRequests,
  approveWorker,
  rejectWorker,
  getAllUsers,
  toggleUserStatus,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/worker-requests', getWorkerRequests);
router.post('/workers/:id/approve', validateObjectId('id'), approveWorker);
router.post('/workers/:id/reject', validateObjectId('id'), rejectWorker);
router.get('/users', getAllUsers);
router.put('/users/:id/status', validateObjectId('id'), toggleUserStatus);

module.exports = router;
