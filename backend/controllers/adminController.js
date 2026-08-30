const User = require('../models/User');
const Ticket = require('../models/Ticket');
const { createNotification } = require('../services/notificationService');

// @desc    Get admin platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res, next) => {
  try {
    const [
      totalCustomers,
      totalWorkers,
      pendingWorkerApplications,
      approvedWorkers,
      rejectedWorkerApplications,
      totalRequests,
      resolvedRequests,
      pendingRequests,
    ] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'worker' }),
      User.countDocuments({ role: 'worker', workerApprovalStatus: 'Pending Approval' }),
      User.countDocuments({ role: 'worker', workerApprovalStatus: 'Approved' }),
      User.countDocuments({ role: 'worker', workerApprovalStatus: 'Rejected' }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ status: 'Pending' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalWorkers,
        pendingWorkerApplications,
        approvedWorkers,
        rejectedWorkerApplications,
        totalRequests,
        resolvedRequests,
        pendingRequests,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all Worker applications / registration requests
// @route   GET /api/admin/worker-requests
// @access  Private (Admin)
const getWorkerRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { role: 'worker' };

    if (status) {
      filter.workerApprovalStatus = status;
    }

    const workers = await User.find(filter)
      .select('name email role isActive workerApprovalStatus workerBio workerSkills createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: workers.length,
      workers,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Approve a Worker application
// @route   POST /api/admin/workers/:id/approve
// @access  Private (Admin)
const approveWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker application not found.',
      });
    }

    worker.workerApprovalStatus = 'Approved';
    worker.isActive = true;
    await worker.save();

    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`user_${worker._id.toString()}`).emit('worker-application-approved', {
        workerId: worker._id,
      });
    }

    await createNotification({
      recipient: worker._id,
      type: 'worker_application_approved',
      title: 'Worker Application Approved',
      message: 'Your Worker application has been approved by the Admin. You can now login and start receiving Customer requests.',
    });

    res.status(200).json({
      success: true,
      message: `Worker ${worker.name} has been approved successfully.`,
      worker: worker.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reject a Worker application
// @route   POST /api/admin/workers/:id/reject
// @access  Private (Admin)
const rejectWorker = async (req, res, next) => {
  try {
    const worker = await User.findById(req.params.id);

    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        message: 'Worker application not found.',
      });
    }

    worker.workerApprovalStatus = 'Rejected';
    await worker.save();

    const activeIo = global.io;
    if (activeIo) {
      activeIo.to(`user_${worker._id.toString()}`).emit('worker-application-rejected', {
        workerId: worker._id,
      });
    }

    await createNotification({
      recipient: worker._id,
      type: 'worker_application_rejected',
      title: 'Worker Application Status',
      message: 'Your Worker application was not approved by the Admin.',
    });

    res.status(200).json({
      success: true,
      message: `Worker application for ${worker.name} has been marked as Rejected.`,
      worker: worker.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all users across the platform
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const users = await User.find(filter)
      .select('name email role isActive workerApprovalStatus createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.role === 'admin' && user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} is now ${user.isActive ? 'Active' : 'Deactivated'}.`,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStats,
  getWorkerRequests,
  approveWorker,
  rejectWorker,
  getAllUsers,
  toggleUserStatus,
};
