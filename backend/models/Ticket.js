const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Ticket must belong to a customer'],
      index: true,
    },
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject for the ticket'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the issue'],
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
      enum: ['General', 'Technical', 'Billing', 'Account', 'Network', 'Hardware', 'Software', 'Urgent Support'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical', 'Urgent'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['New', 'Pending', 'Accepted', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    aiTriage: {
      category: { type: String, default: 'General' },
      priority: { type: String, default: 'Medium' },
      summary: { type: String, default: '' },
      confidence: { type: Number, default: 0.85 },
      analyzedAt: { type: Date, default: Date.now },
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    acceptedAt: {
      type: Date,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);
