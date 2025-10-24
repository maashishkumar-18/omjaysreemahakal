const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

const paymentSchema = new mongoose.Schema({
  loanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
    required: true
  },
  borrowerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  lenderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  forDays: {
    type: Number,
    required: true,
    min: 1
  },
  screenshotUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  adminApprovalDate: {
    type: Date
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String
  },
  utrNumber: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

paymentSchema.index({ loanId: 1, status: 1 });
paymentSchema.index({ borrowerId: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);