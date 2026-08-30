const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false, // Do not return password by default in queries
    },
    role: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      default: 'customer',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workerApprovalStatus: {
      type: String,
      enum: ['None', 'Pending Approval', 'Approved', 'Rejected'],
      default: function () {
        return this.role === 'worker' ? 'Pending Approval' : 'None';
      },
    },
    workerBio: {
      type: String,
      trim: true,
      default: '',
    },
    workerSkills: {
      type: [String],
      default: [],
    },
    passwordResetOTPHash: {
      type: String,
      default: null,
    },
    passwordResetOTPExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Safe representation of user without sensitive fields
userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  delete user.passwordResetOTPHash;
  delete user.passwordResetOTPExpiresAt;
  return user;
};

module.exports = mongoose.model('User', userSchema);
