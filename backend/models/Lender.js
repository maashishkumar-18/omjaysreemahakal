const mongoose = require('mongoose');

const lenderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  upiId: {
    type: String,
    required: true
  },
  upiQrCodeUrl: {
    type: String,
    required: true
  },
  totalAmountLent: {
    type: Number,
    default: 0
  },
  activeLoansCount: {
    type: Number,
    default: 0
  },
  totalEarnings: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lender', lenderSchema);