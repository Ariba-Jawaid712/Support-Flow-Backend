const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'worker_application_submitted',
        'worker_application_approved',
        'worker_application_rejected',
        'ticket_created',
        'ticket_accepted',
        'ticket_rejected',
        'ticket_priority_updated',
        'ticket_status_updated',
        'new_message',
        'ticket_resolved',
        'review_requested',
        'system_alert',
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
