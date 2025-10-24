const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { ROLES } = require('../config/constants');
const upload = require('../middleware/upload');
const {
  createUser,
  getUsers,
  getUserDetails,
  getDashboardStats,
  getPendingPayments,
  approvePayment,
  rejectPayment,
  updateUserStatus,
  deleteUser,
  getAuditLogs,
  updateOverdueLoans,
  getLoanDetails,
  updateLoanStatus
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.ADMIN));

// User Management Routes
router.route('/users')
  .post(upload.single('qrCode'), createUser)
  .get(getUsers);

router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Dashboard & Analytics Routes
router.get('/dashboard/stats', getDashboardStats);

// Payment Management Routes
router.get('/payments/pending', getPendingPayments);
router.put('/payments/:paymentId/approve', approvePayment);
router.put('/payments/:paymentId/reject', rejectPayment);

// Loan Management Routes
router.get('/loans/:id', getLoanDetails);
router.put('/loans/:id/status', updateLoanStatus);

// System Management Routes
router.get('/audit-logs', getAuditLogs);
router.post('/maintenance/update-overdue-loans', updateOverdueLoans);

module.exports = router;