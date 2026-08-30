const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTPEmail } = require('../services/emailService');
const { createNotification } = require('../services/notificationService');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'supportflow_super_secret_jwt_key_2026_secure',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    }
  );
};

// @desc    Register a new user (Customer or Worker)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword, role, workerBio, workerSkills } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    const assignedRole = role === 'worker' ? 'worker' : 'customer';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: assignedRole,
      workerBio: workerBio || '',
      workerSkills: Array.isArray(workerSkills) ? workerSkills : (workerSkills ? workerSkills.split(',').map((s) => s.trim()) : []),
      workerApprovalStatus: assignedRole === 'worker' ? 'Pending Approval' : 'None',
    });

    // If a worker registered, notify all Admins
    if (assignedRole === 'worker') {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await createNotification({
          recipient: admin._id,
          type: 'worker_application_submitted',
          title: 'New Worker Application',
          message: `${user.name} (${user.email}) has registered as a Worker and is awaiting review.`,
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Worker application submitted successfully. Your account is pending Administrator review before you can log in.',
        user: user.toSafeObject(),
      });
    }

    // Customer login token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Log in user & return JWT
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated. Please contact support.',
      });
    }

    // Strict Worker approval check
    if (user.role === 'worker') {
      if (user.workerApprovalStatus === 'Pending Approval') {
        return res.status(403).json({
          success: false,
          message: 'Your Worker account is pending Admin approval. You cannot log in until approved.',
        });
      }

      if (user.workerApprovalStatus === 'Rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your Worker application was rejected by the Administrator. Access denied.',
        });
      }
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Initiate password reset by sending 6-digit OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    // Respond consistently to avoid account enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a 6-digit OTP has been dispatched.',
      });
    }

    // Generate 6-digit random numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    const expiryMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES, 10) || 10;
    user.passwordResetOTPHash = otpHash;
    user.passwordResetOTPExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    await user.save();

    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a 6-digit OTP has been dispatched.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordResetOTPHash || !user.passwordResetOTPExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP or no password reset requested.',
      });
    }

    if (user.passwordResetOTPExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
      });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), user.passwordResetOTPHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code. Please check and try again.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You may now reset your password.',
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using verified OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters in length.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.passwordResetOTPHash || !user.passwordResetOTPExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reset attempt or no OTP requested.',
      });
    }

    if (user.passwordResetOTPExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new code.',
      });
    }

    const isMatch = await bcrypt.compare(otp.toString().trim(), user.passwordResetOTPHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP code provided.',
      });
    }

    // Set new password (pre-save hook will hash it)
    user.password = newPassword;
    user.passwordResetOTPHash = null;
    user.passwordResetOTPExpiresAt = null;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
