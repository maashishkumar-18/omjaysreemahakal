const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { ROLES } = require('../config/constants');
const upload = require('../middleware/upload');
const {
  getDashboard,
  getLoanDetails,
  getLenderQRCode,
  submitPayment,
  getPaymentHistory
} = require('../controllers/borrowerController');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.BORROWER));

router.get('/dashboard', getDashboard);
router.get('/loan-details', getLoanDetails);
router.get('/lender-qr-code', getLenderQRCode);
router.get('/payment-history', getPaymentHistory);
router.post('/submit-payment', upload.single('screenshot'), submitPayment);

module.exports = router;