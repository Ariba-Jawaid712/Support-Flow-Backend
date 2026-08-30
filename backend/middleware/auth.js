const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token is missing. Please log in.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supportflow_super_secret_jwt_key_2026_secure');
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This user account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role (${req.user ? req.user.role : 'anonymous'}) is not authorized to access this resource.`,
      });
    }
    next();
  };
};

const requireApprovedWorker = (req, res, next) => {
  if (req.user.role !== 'worker') {
    return next();
  }

  if (req.user.workerApprovalStatus === 'Pending Approval') {
    return res.status(403).json({
      success: false,
      message: 'Your Worker account is pending Admin approval. You cannot perform worker operations yet.',
    });
  }

  if (req.user.workerApprovalStatus === 'Rejected') {
    return res.status(403).json({
      success: false,
      message: 'Your Worker application was rejected by the Admin. Access denied.',
    });
  }

  if (req.user.workerApprovalStatus !== 'Approved') {
    return res.status(403).json({
      success: false,
      message: 'Worker account is not approved for service access.',
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireApprovedWorker,
};
