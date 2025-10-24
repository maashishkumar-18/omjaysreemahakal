const Payment = require('../models/Payment');
const Loan = require('../models/Loan');
const { paymentService } = require('../services/paymentService');
const  auditService  = require('../services/auditService');

// @desc    Get pending payments for admin
// @route   GET /api/admin/payments/pending
// @access  Private/Admin
exports.getPendingPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ status: 'pending' })
      .populate('loanId', 'loanId principalAmount emiPerDay')
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name')
      .sort({ paymentDate: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve payment
// @route   PUT /api/admin/payments/:paymentId/approve
// @access  Private/Admin
exports.approvePayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const result = await paymentService.approvePayment(paymentId, req.user._id);

    // Audit log
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'PAYMENT_APPROVE',
      'Payment',
      paymentId,
      { amount: result.payment.amount, loanId: result.loan.loanId }
    );

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject payment
// @route   PUT /api/admin/payments/:paymentId/reject
// @access  Private/Admin
exports.rejectPayment = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const payment = await paymentService.rejectPayment(
      paymentId, 
      req.user._id, 
      rejectionReason
    );

    // Audit log
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'PAYMENT_REJECT',
      'Payment',
      paymentId,
      { rejectionReason, loanId: payment.loanId }
    );

    res.status(200).json({
      success: true,
      message: 'Payment rejected successfully',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments with filters (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, loanId, borrowerId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    if (status) filter.status = status;
    if (loanId) filter.loanId = loanId;
    if (borrowerId) filter.borrowerId = borrowerId;

    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate) filter.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(filter)
      .populate('loanId', 'loanId')
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name')
      .populate('adminId', 'username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};