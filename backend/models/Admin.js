const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: ['user_management', 'loan_management', 'payment_approval', 'reports']
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for frequently queried fields
adminSchema.index({ userId: 1 });
adminSchema.index({ email: 1 });

module.exports = mongoose.model('Admin', adminSchema);