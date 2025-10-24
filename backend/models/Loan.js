const mongoose = require('mongoose');
const { LOAN_STATUS } = require('../config/constants');

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    required: true
  },
  borrowerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrower',
    required: true
  },
  lenderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lender',
    required: true
  },
  borrowerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lenderUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  principalAmount: {
    type: Number,
    required: true,
    min: 1
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  emiPerDay: {
    type: Number,
    required: true,
    min: 1
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(LOAN_STATUS),
    default: LOAN_STATUS.ACTIVE
  },
  totalAmountRepaid: {
    type: Number,
    default: 0
  },
  remainingBalance: {
    type: Number,
    required: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  daysOverdue: {
    type: Number,
    default: 0
  },
  adminNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

loanSchema.index({ borrowerId: 1, status: 1 });
loanSchema.index({ lenderId: 1, status: 1 });
loanSchema.index({ borrowerUserId: 1 });
loanSchema.index({ lenderUserId: 1 });
loanSchema.index({ adminId: 1 });

module.exports = mongoose.model('Loan', loanSchema);