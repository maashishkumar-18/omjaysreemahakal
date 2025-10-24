const mongoose = require('mongoose');
const User = require('../models/User');
const Lender = require('../models/Lender');
const Borrower = require('../models/Borrower');
const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const fileUploadService = require('../services/fileUploadService');
const auditService = require('../services/auditService');
const paymentService = require('../services/paymentService');
const  loanService  = require('../services/loanService');

// @desc    Create user (Borrower/Lender)
// @route   POST /api/admin/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  let session;
  try {
    const { role, name, phoneNumber, address, upiId, username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if phone number already exists
    const existingPhone = role === 'lender'
      ? await Lender.findOne({ phoneNumber })
      : await Borrower.findOne({ phoneNumber });

    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Create user
    const [user] = await User.create([{
      username,
      password,
      role
    }], { session });

    let profile;
    if (role === 'lender') {
      let qrCodeUrl = '';
      if (req.file) {
        qrCodeUrl = await fileUploadService.uploadQRCode(req.file, user._id);
      } else {
        return res.status(400).json({ message: 'QR code is required for lenders' });
      }

      [profile] = await Lender.create([{
        userId: user._id,
        name,
        phoneNumber,
        upiId,
        upiQrCodeUrl: qrCodeUrl
      }], { session });
    } else if (role === 'borrower') {
      [profile] = await Borrower.create([{
        userId: user._id,
        name,
        phoneNumber,
        address
      }], { session });
    }

    await session.commitTransaction();  // ✅ Commit only once
    session.endSession();               // ✅ End session before audit

    // Audit log (not part of transaction)
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'USER_CREATE',
      role,
      user._id,
      { username, role, name }
    );

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      data: {
        user: {
          id: user._id,
          username: user.username,
          role: user.role
        },
        profile
      }
    });
  } catch (error) {
    try {
      await session.abortTransaction(); // ✅ Only abort if not yet committed
    } catch (abortErr) {
      // Ignore abort errors (session may already be committed)
    } finally {
      session.endSession();
    }

    next(error);
  }
};


// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const skip = (page - 1) * limit;

    let userFilter = { role: { $ne: 'admin' } };
    if (role) {
      userFilter.role = role;
    }

    const users = await User.find(userFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const userIds = users.map(user => user._id);

    // Get profiles
    const lenders = await Lender.find({ userId: { $in: userIds } });
    const borrowers = await Borrower.find({ userId: { $in: userIds } });

    const profilesMap = {};
    [...lenders, ...borrowers].forEach(profile => {
      profilesMap[profile.userId.toString()] = profile;
    });

    const usersWithProfiles = users.map(user => ({
      ...user,
      profile: profilesMap[user._id.toString()] || null
    }));

    const total = await User.countDocuments(userFilter);

    res.status(200).json({
      success: true,
      data: usersWithProfiles,
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

// @desc    Get user details with loans
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profile;
    let loans = [];

    if (user.role === 'lender') {
      profile = await Lender.findOne({ userId: user._id });
      // Get loans using lenderUserId
      loans = await Loan.find({ lenderUserId: user._id })
        .populate('borrowerId', 'name phoneNumber')
        .populate('borrowerUserId', 'username')
        .sort({ createdAt: -1 });
    } else if (user.role === 'borrower') {
      profile = await Borrower.findOne({ userId: user._id });
      // Get loans using borrowerUserId
      loans = await Loan.find({ borrowerUserId: user._id })
        .populate('lenderId', 'name phoneNumber upiId')
        .populate('lenderUserId', 'username')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        profile,
        loans
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total counts
    const totalLenders = await Lender.countDocuments();
    const totalBorrowers = await Borrower.countDocuments();
    
    // Get loan metrics
    const loanMetrics = await loanService.calculateLoanMetrics();
    
    // Get recent activities
    const recentPayments = await Payment.find()
      .populate('borrowerId', 'name')
      .populate('loanId', 'loanId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get pending payments count
    const pendingPaymentsCount = await Payment.countDocuments({ status: 'pending' });
    
    // Calculate weekly earnings
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weeklyEarnings = await Payment.aggregate([
      {
        $match: {
          status: 'approved',
          adminApprovalDate: { $gte: oneWeekAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const stats = {
      overview: {
        totalLenders,
        totalBorrowers,
        totalLoans: loanMetrics.totalLoans,
        activeLoans: loanMetrics.activeLoans,
        pendingPayments: pendingPaymentsCount
      },
      financials: {
        totalAmountLent: loanMetrics.totalAmountLent,
        totalAmountRepaid: loanMetrics.totalAmountRepaid,
        weeklyEarnings: weeklyEarnings[0]?.total || 0,
        outstandingBalance: loanMetrics.totalAmountLent - loanMetrics.totalAmountRepaid
      },
      loanStatus: {
        active: loanMetrics.activeLoans,
        closed: loanMetrics.closedLoans,
        defaulted: loanMetrics.defaultedLoans
      },
      recentActivities: recentPayments
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending payments for admin approval
// @route   GET /api/admin/payments/pending
// @access  Private/Admin
exports.getPendingPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ status: 'pending' })
      .populate('loanId', 'loanId principalAmount emiPerDay lenderId')
      .populate('borrowerId', 'name phoneNumber')
      .populate({
        path: 'loanId',
        populate: {
          path: 'lenderId',
          select: 'name'
        }
      })
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

// @desc    Approve a payment
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
      { 
        amount: result.payment.amount, 
        loanId: result.loan.loanId,
        forDays: result.payment.forDays 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Payment approved successfully',
      data: {
        payment: result.payment,
        loan: result.loan
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a payment
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
      { 
        rejectionReason, 
        loanId: payment.loanId,
        amount: payment.amount 
      }
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

// @desc    Update user status (activate/deactivate)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    console.log('Updating user status:', { id, isActive });

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!user) {
      console.log('User not found:', id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User updated successfully:', user._id, user.isActive);

    // Audit log
    try {
      await auditService.logAction(
        req.user._id,
        req.user.role,
        'USER_STATUS_UPDATE',
        'User',
        user._id,
        {
          username: user.username,
          role: user.role,
          newStatus: isActive ? 'active' : 'inactive'
        }
      );
      console.log('Audit log created successfully');
    } catch (auditError) {
      console.error('Audit log error:', auditError);
      // Don't fail the request if audit logging fails
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    next(error);
  }
};

// @desc    Delete user permanently
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has active loans
    const activeLoans = await Loan.find({
      $or: [
        { borrowerUserId: id },
        { lenderUserId: id }
      ],
      status: 'active'
    });

    if (activeLoans.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with active loans. Please close all loans first.'
      });
    }

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete profile
      if (user.role === 'lender') {
        await Lender.findOneAndDelete({ userId: id }, { session });
      } else if (user.role === 'borrower') {
        await Borrower.findOneAndDelete({ userId: id }, { session });
      }

      // Delete all associated loans and payments
      await Loan.deleteMany({
        $or: [
          { borrowerUserId: id },
          { lenderUserId: id }
        ]
      }, { session });

      await Payment.deleteMany({
        $or: [
          { borrowerId: { $in: await Borrower.find({ userId: id }).distinct('_id') } },
          { loanId: { $in: await Loan.find({
            $or: [
              { borrowerUserId: id },
              { lenderUserId: id }
            ]
          }).distinct('_id') } }
        ]
      }, { session });

      // Delete user
      await User.findByIdAndDelete(id, { session });

      await session.commitTransaction();

      // Audit log
      await auditService.logAction(
        req.user._id,
        req.user.role,
        'USER_DELETE',
        'User',
        id,
        {
          username: user.username,
          role: user.role
        }
      );

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private/Admin
exports.getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { action, userRole, startDate, endDate } = req.query;

    let filters = {};
    if (action) filters.action = action;
    if (userRole) filters.userRole = userRole;
    
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const auditLogs = await auditService.getAuditLogs(filters, page, limit);

    res.status(200).json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Run system maintenance tasks
// @route   POST /api/admin/maintenance/update-overdue-loans
// @access  Private/Admin
exports.updateOverdueLoans = async (req, res, next) => {
  try {
    const updatedCount = await loanService.updateOverdueLoans();

    // Audit log
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'SYSTEM_MAINTENANCE',
      'System',
      null,
      { 
        task: 'update_overdue_loans',
        loansUpdated: updatedCount 
      }
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedCount} overdue loans`,
      data: { loansUpdated: updatedCount }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get loan details for admin
// @route   GET /api/admin/loans/:id
// @access  Private/Admin
exports.getLoanDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const loanDetails = await loanService.getLoanSummary(id);

    res.status(200).json({
      success: true,
      data: loanDetails
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update loan status
// @route   PUT /api/admin/loans/:id/status
// @access  Private/Admin
exports.updateLoanStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'closed', 'defaulted'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, closed, defaulted'
      });
    }

    const loan = await Loan.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('borrowerId', 'name phoneNumber')
    .populate('lenderId', 'name phoneNumber');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // If closing a loan, update lender's active loans count
    if (status === 'closed') {
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        { $inc: { activeLoansCount: -1 } }
      );
    }

    // Audit log
    await auditService.logAction(
      req.user._id,
      req.user.role,
      'LOAN_STATUS_UPDATE',
      'Loan',
      loan._id,
      { 
        loanId: loan.loanId,
        previousStatus: loan.status,
        newStatus: status 
      }
    );

    res.status(200).json({
      success: true,
      message: `Loan status updated to ${status} successfully`,
      data: loan
    });
  } catch (error) {
    next(error);
  }
};