const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Lender = require('../models/Lender');
const Borrower = require('../models/Borrower');
const fileUploadService = require('../services/fileUploadService');
const auditService = require('../services/auditService');

// @desc    Get borrower dashboard
// @route   GET /api/borrower/dashboard
// @access  Private/Borrower
exports.getDashboard = async (req, res, next) => {
  try {
    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const activeLoan = await Loan.findOne({
      borrowerUserId: req.user._id, // Use borrowerUserId instead of borrowerId
      status: 'active'
    })
    .populate('lenderId', 'name phoneNumber upiId')
    .lean();

    let dashboardData = {
      borrower: {
        name: borrower.name,
        phoneNumber: borrower.phoneNumber,
        address: borrower.address,
        creditScore: borrower.creditScore
      },
      activeLoan: null,
      paymentSummary: {
        totalPaid: 0,
        remainingBalance: 0,
        nextDueDate: null,
        daysOverdue: 0
      }
    };

    if (activeLoan) {
      const payments = await Payment.find({
        loanId: activeLoan._id,
        status: 'approved'
      });

      const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      dashboardData.activeLoan = activeLoan;
      dashboardData.paymentSummary = {
        totalPaid,
        remainingBalance: activeLoan.remainingBalance,
        nextDueDate: activeLoan.nextDueDate,
        daysOverdue: activeLoan.daysOverdue,
        emiPerDay: activeLoan.emiPerDay
      };
    }

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrower loan details
// @route   GET /api/borrower/loan-details
// @access  Private/Borrower
exports.getLoanDetails = async (req, res, next) => {
  try {
    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const loan = await Loan.findOne({
      borrowerUserId: req.user._id,
      status: 'active'  // Only return active loans
    })
    .populate('lenderId', 'name phoneNumber upiId upiQrCodeUrl')
    .populate('adminId', 'username');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'No active loan found'
      });
    }

    // Get payment summary for the loan
    const payments = await Payment.find({
      loanId: loan._id,
      status: 'approved'
    });

    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const loanData = {
      activeLoan: loan,
      paymentSummary: {
        totalPaid,
        remainingBalance: loan.remainingBalance,
        nextDueDate: loan.nextDueDate,
        daysOverdue: loan.daysOverdue,
        emiPerDay: loan.emiPerDay
      }
    };

    res.status(200).json({
      success: true,
      data: loanData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get lender QR code for payment
// @route   GET /api/borrower/lender-qr-code
// @access  Private/Borrower
exports.getLenderQRCode = async (req, res, next) => {
  try {
    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const loan = await Loan.findOne({ borrowerUserId: req.user._id, status: 'active' })
      .populate('lenderId', 'name upiId upiQrCodeUrl');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'No active loan found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        lenderName: loan.lenderId.name,
        upiId: loan.lenderId.upiId,
        qrCodeUrl: loan.lenderId.upiQrCodeUrl,
        emiPerDay: loan.emiPerDay
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit payment
// @route   POST /api/borrower/submit-payment
// @access  Private/Borrower
exports.submitPayment = async (req, res, next) => {
  try {
    const { amount, forDays, utrNumber } = req.body;

    console.log('Payment submission request:', { amount, forDays, utrNumber, hasFile: !!req.file });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      console.log('Borrower not found for user:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const loan = await Loan.findOne({
      borrowerUserId: req.user._id, // Use borrowerUserId
      status: 'active'
    });

    if (!loan) {
      console.log('No active loan found for borrower:', borrower._id);
      return res.status(404).json({
        success: false,
        message: 'No active loan found'
      });
    }

    // Get lender details to ensure we have lenderUserId
    const lender = await Lender.findById(loan.lenderId);
    if (!lender) {
      console.log('Lender not found for loan:', loan._id);
      return res.status(404).json({
        success: false,
        message: 'Lender not found'
      });
    }

    console.log('Loan details:', {
      loanId: loan.loanId,
      emiPerDay: loan.emiPerDay,
      remainingBalance: loan.remainingBalance
    });

    // Validate payment amount
    const expectedAmount = loan.emiPerDay * forDays;
    console.log('Amount validation:', {
      provided: parseFloat(amount),
      expected: expectedAmount,
      forDays: parseInt(forDays)
    });

    if (parseFloat(amount) !== expectedAmount) {
      console.log('Amount validation failed');
      return res.status(400).json({
        success: false,
        message: `Payment amount should be exactly ${expectedAmount} for ${forDays} day(s)`
      });
    }

    // Check if remaining balance is sufficient
    if (parseFloat(amount) > loan.remainingBalance) {
      console.log('Balance check failed:', { amount: parseFloat(amount), remaining: loan.remainingBalance });
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining loan balance'
      });
    }

    // Upload payment screenshot
    const screenshotUrl = await fileUploadService.uploadPaymentScreenshot(
      req.file, 
      `payment-${Date.now()}`
    );

    // Create payment record
    const payment = await Payment.create({
      loanId: loan._id,
      borrowerId: borrower._id,
      borrowerUserId: req.user._id,
      lenderId: loan.lenderId,
      lenderUserId: lender.userId,
      amount: parseFloat(amount),
      forDays: parseInt(forDays),
      screenshotUrl,
      utrNumber,
      status: 'pending'
    });

    // Audit log
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'PAYMENT_SUBMIT',
      'Payment',
      payment._id,
      { amount, forDays, loanId: loan.loanId }
    );

    res.status(201).json({
      success: true,
      message: 'Payment submitted successfully. Waiting for admin approval.',
      data: payment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment history
// @route   GET /api/borrower/payment-history
// @access  Private/Borrower
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const payments = await Payment.find({ borrowerUserId: req.user._id })
      .populate('loanId', 'loanId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ borrowerUserId: req.user._id });

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