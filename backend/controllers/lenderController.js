const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Lender = require('../models/Lender');

// @desc    Get lender dashboard
// @route   GET /api/lender/dashboard
// @access  Private/Lender
exports.getDashboard = async (req, res, next) => {
  try {
    const lender = await Lender.findOne({ userId: req.user._id });
    if (!lender) {
      return res.status(404).json({
        success: false,
        message: 'Lender profile not found'
      });
    }

    // Get lender's active loans
    const activeLoans = await Loan.find({
      lenderUserId: req.user._id, // Use lenderUserId instead of lenderId
      status: 'active'
    })
    .populate('borrowerId', 'name phoneNumber')
    .lean();

    // Get recent payments
    const recentPayments = await Payment.find({
      loanId: { $in: activeLoans.map(loan => loan._id) },
      status: 'approved'
    })
    .populate('loanId', 'loanId')
    .populate('borrowerId', 'name')
    .sort({ adminApprovalDate: -1 })
    .limit(5);

    const dashboardData = {
      lender: {
        name: lender.name,
        phoneNumber: lender.phoneNumber,
        totalAmountLent: lender.totalAmountLent,
        activeLoansCount: lender.activeLoansCount,
        totalEarnings: lender.totalEarnings
      },
      summary: {
        totalActiveLoans: activeLoans.length,
        totalAmountRecoverable: activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0),
        monthlyEarnings: recentPayments.reduce((sum, payment) => sum + payment.amount, 0)
      },
      activeLoans,
      recentPayments
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lender's loans
// @route   GET /api/lender/loans
// @access  Private/Lender
exports.getLoans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status } = req.query;
    const skip = (page - 1) * limit;

    const lender = await Lender.findOne({ userId: req.user._id });
    if (!lender) {
      return res.status(404).json({
        success: false,
        message: 'Lender profile not found'
      });
    }

    let filter = { lenderUserId: req.user._id }; // Use lenderUserId
    if (status) {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('borrowerId', 'name phoneNumber address')
      .populate('borrowerUserId', 'username role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: loans,
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

// @desc    Get payment details for a specific loan
// @route   GET /api/lender/payments/:loanId
// @access  Private/Lender
exports.getLoanPayments = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const lender = await Lender.findOne({ userId: req.user._id });
    if (!lender) {
      return res.status(404).json({
        success: false,
        message: 'Lender profile not found'
      });
    }

    // Verify that the loan belongs to this lender
    const loan = await Loan.findOne({ _id: loanId, lenderUserId: req.user._id });
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found or access denied'
      });
    }

    const payments = await Payment.find({ loanId })
      .populate('borrowerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ loanId });

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

// @desc    Get lender profile
// @route   GET /api/lender/profile
// @access  Private/Lender
exports.getProfile = async (req, res, next) => {
  try {
    const lender = await Lender.findOne({ userId: req.user._id });
    if (!lender) {
      return res.status(404).json({
        success: false,
        message: 'Lender profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lender
    });
  } catch (error) {
    next(error);
  }
};