const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { ROLES } = require('../config/constants');
const { validatePaymentAction, validateMongoId } = require('../middleware/validation');
const {
  getPendingPayments,
  approvePayment,
  rejectPayment,
  getAllPayments
} = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);

// Admin routes
router.get('/admin/pending', authorize(ROLES.ADMIN), getPendingPayments);
router.get('/admin', authorize(ROLES.ADMIN), getAllPayments);
router.put('/admin/:paymentId/approve', authorize(ROLES.ADMIN), validateMongoId, approvePayment);
router.put('/admin/:paymentId/reject', authorize(ROLES.ADMIN), validateMongoId, validatePaymentAction, rejectPayment);

module.exports = router;