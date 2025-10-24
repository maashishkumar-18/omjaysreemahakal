const mongoose = require('mongoose');
const Loan = require('../models/Loan');
const Lender = require('../models/Lender');
const Borrower = require('../models/Borrower');
const Payment = require('../models/Payment');
const { generateLoanId } = require('../utils/loanIdGenerator');
const auditService = require('../services/auditService');

// @desc    Create a new loan
// @route   POST /api/loans
// @access  Private/Admin
exports.createLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { borrowerId, lenderId, principalAmount, totalDays, emiPerDay, startDate } = req.body;

    const borrower = await Borrower.findById(borrowerId);
    if (!borrower) {
      throw new Error('Borrower not found');
    }

    const lender = await Lender.findById(lenderId);
    if (!lender) {
      throw new Error('Lender not found');
    }

    const existingActiveLoan = await Loan.findOne({ borrowerId, status: 'active' });
    if (existingActiveLoan) {
      throw new Error('Borrower already has an active loan');
    }

    const loanId = await generateLoanId();
    const start = new Date(startDate);
    const endDate = new Date(start);
    endDate.setDate(start.getDate() + parseInt(totalDays));
    const nextDueDate = new Date(start);

    const loan = await Loan.create([{
      loanId,
      borrowerId,
      lenderId,
      borrowerUserId: borrower.userId, // Add this line
      lenderUserId: lender.userId,     // Add this line
      adminId: req.user._id,
      principalAmount: parseFloat(principalAmount),
      totalDays: parseInt(totalDays),
      emiPerDay: parseFloat(emiPerDay),
      startDate: start,
      endDate,
      remainingBalance: parseFloat(principalAmount),
      nextDueDate
    }], { session });
    await Lender.findByIdAndUpdate(
      lenderId,
      { $inc: { totalAmountLent: parseFloat(principalAmount), activeLoansCount: 1 } },
      { session }
    );

    await Borrower.findByIdAndUpdate(
      borrowerId,
      { $inc: { totalBorrowed: parseFloat(principalAmount) } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Now everything after this point is outside the transaction
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'LOAN_CREATE',
      'Loan',
      loan._id,
      { loanId, borrowerId, lenderId, principalAmount }
    );

    const populatedLoan = await Loan.findById(loan._id)
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: populatedLoan
    });

  } catch (error) {
    try {
      // Only abort if still active
      await session.abortTransaction();
    } catch (abortError) {
      console.warn('Abort failed or not needed:', abortError.message);
    } finally {
      session.endSession();
    }
    next(error);
  }
};

// @desc    Get all loans with filters
// @route   GET /api/loans
// @access  Private/Admin
exports.getLoans = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, lenderId, borrowerId, loanId } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (lenderId) filter.lenderId = lenderId;
    if (borrowerId) filter.borrowerId = borrowerId;
    if (loanId) filter.loanId = { $regex: loanId, $options: 'i' };

    const loans = await Loan.find(filter)
      .populate('borrowerId', 'name phoneNumber address')
      .populate('lenderId', 'name phoneNumber upiId')
      .populate('borrowerUserId', 'username role')
      .populate('lenderUserId', 'username role')
      .populate('adminId', 'username')
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

// @desc    Get loan details by ID
// @route   GET /api/loans/:id
// @access  Private/Admin
exports.getLoanDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findById(id)
      .populate('borrowerId', 'name phoneNumber address')
      .populate('lenderId', 'name phoneNumber upiId upiQrCodeUrl')
      .populate('borrowerUserId', 'username role')
      .populate('lenderUserId', 'username role')
      .populate('adminId', 'username');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Get payment history for this loan
    const payments = await Payment.find({ loanId: id })
      .populate('adminId', 'username')
      .sort({ paymentDate: -1 });

    // Calculate payment summary
    const approvedPayments = payments.filter(p => p.status === 'approved');
    const totalPaid = approvedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingPayments = payments.filter(p => p.status === 'pending');

    const loanDetails = {
      loan,
      paymentSummary: {
        totalPaid,
        remainingBalance: loan.remainingBalance,
        totalPayments: payments.length,
        approvedPayments: approvedPayments.length,
        pendingPayments: pendingPayments.length,
        daysOverdue: loan.daysOverdue
      },
      paymentHistory: payments
    };

    res.status(200).json({
      success: true,
      data: loanDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update loan status
// @route   PUT /api/loans/:id/status
// @access  Private/Admin
exports.updateLoanStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionCommitted = false;

  try {
    session.startTransaction();

    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['active', 'closed', 'defaulted'];
    if (!validStatuses.includes(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, closed, defaulted'
      });
    }

    const loan = await Loan.findById(id).session(session);
    if (!loan) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    const previousStatus = loan.status;

    // Update loan status
    loan.status = status;

    // If closing a loan and there's remaining balance, set it to zero
    if (status === 'closed' && loan.remainingBalance > 0) {
      loan.remainingBalance = 0;
    }

    // Update notes if provided
    if (notes) {
      loan.adminNotes = notes;
    }

    await loan.save({ session });

    // If status changed to closed or defaulted, update lender's active loans count
    if ((status === 'closed' || status === 'defaulted') && previousStatus === 'active') {
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        { $inc: { activeLoansCount: -1 } },
        { session }
      );
    }

    // If reactivating a loan, update lender's active loans count
    if (status === 'active' && previousStatus !== 'active') {
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        { $inc: { activeLoansCount: 1 } },
        { session }
      );
    }

    await session.commitTransaction();
    transactionCommitted = true;
    session.endSession();

    // Audit log (outside transaction)
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'LOAN_STATUS_UPDATE',
      'Loan',
      loan._id,
      {
        loanId: loan.loanId,
        previousStatus,
        newStatus: status,
        notes
      }
    );

    const updatedLoan = await Loan.findById(id)
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name phoneNumber');

    res.status(200).json({
      success: true,
      message: `Loan status updated to ${status} successfully`,
      data: updatedLoan
    });
  } catch (error) {
    if (!transactionCommitted) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.warn('Transaction abort failed:', abortError.message);
      }
    }
    session.endSession();
    next(error);
  }
};

// @desc    Get loans for borrower (for borrower role)
// @route   GET /api/borrower/loans
// @access  Private/Borrower
exports.getBorrowerLoans = async (req, res, next) => {
  try {
    const borrower = await Borrower.findOne({ userId: req.user._id });
    if (!borrower) {
      return res.status(404).json({
        success: false,
        message: 'Borrower profile not found'
      });
    }

    const loans = await Loan.find({ borrowerId: borrower._id })
      .populate('lenderId', 'name phoneNumber upiId upiQrCodeUrl')
      .populate('adminId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: loans
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loans for lender (for lender role)
// @route   GET /api/lender/loans
// @access  Private/Lender
exports.getLenderLoans = async (req, res, next) => {
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

    let filter = { lenderId: lender._id };
    if (status) {
      filter.status = status;
    }

    const loans = await Loan.find(filter)
      .populate('borrowerId', 'name phoneNumber address')
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

// @desc    Search loans by various criteria
// @route   GET /api/loans/search
// @access  Private/Admin
exports.searchLoans = async (req, res, next) => {
  try {
    const { 
      loanId, 
      borrowerName, 
      lenderName, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    let filter = {};

    if (loanId) {
      filter.loanId = { $regex: loanId, $options: 'i' };
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let loansQuery = Loan.find(filter)
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name phoneNumber')
      .sort({ createdAt: -1 });

    // If borrower name is provided, we need to filter after population
    let loans = await loansQuery;

    if (borrowerName) {
      loans = loans.filter(loan => 
        loan.borrowerId.name.toLowerCase().includes(borrowerName.toLowerCase())
      );
    }

    if (lenderName) {
      loans = loans.filter(loan => 
        loan.lenderId.name.toLowerCase().includes(lenderName.toLowerCase())
      );
    }

    res.status(200).json({
      success: true,
      data: loans,
      total: loans.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loan statistics
// @route   GET /api/loans/stats/overview
// @access  Private/Admin
exports.getLoanStats = async (req, res, next) => {
  try {
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const closedLoans = await Loan.countDocuments({ status: 'closed' });
    const defaultedLoans = await Loan.countDocuments({ status: 'defaulted' });
    
    const totalAmountLent = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$principalAmount' } } }
    ]);
    
    const totalAmountRepaid = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmountRepaid' } } }
    ]);

    // Get loans created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLoans = await Loan.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const stats = {
      totalLoans,
      activeLoans,
      closedLoans,
      defaultedLoans,
      totalAmountLent: totalAmountLent[0]?.total || 0,
      totalAmountRepaid: totalAmountRepaid[0]?.total || 0,
      outstandingBalance: (totalAmountLent[0]?.total || 0) - (totalAmountRepaid[0]?.total || 0),
      recentLoans
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete loan permanently
// @route   DELETE /api/loans/:id
// @access  Private/Admin
exports.deleteLoan = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;

    const loan = await Loan.findById(id).session(session);
    if (!loan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Delete all payments associated with this loan
    await Payment.deleteMany({ loanId: id }, { session });

    // Update lender's statistics
    if (loan.status === 'active') {
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        {
          $inc: {
            activeLoansCount: -1,
            totalAmountLent: -loan.principalAmount
          }
        },
        { session }
      );
    } else {
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        {
          $inc: {
            totalAmountLent: -loan.principalAmount
          }
        },
        { session }
      );
    }

    // Update borrower's statistics
    await Borrower.findByIdAndUpdate(
      loan.borrowerId,
      {
        $inc: {
          totalBorrowed: -loan.principalAmount
        }
      },
      { session }
    );

    // Delete the loan
    await Loan.findByIdAndDelete(id, { session });

    await session.commitTransaction();
    session.endSession();

    // Audit log (outside transaction)
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'LOAN_DELETE',
      'Loan',
      id,
      {
        loanId: loan.loanId,
        borrowerId: loan.borrowerId,
        lenderId: loan.lenderId,
        principalAmount: loan.principalAmount
      }
    );

    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch (abortError) {
      console.warn('Transaction abort failed:', abortError.message);
    }
    session.endSession();
    next(error);
  }
};

