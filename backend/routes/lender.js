const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { ROLES } = require('../config/constants');
const {
  getDashboard,
  getLoans,
  getLoanPayments,
  getProfile
} = require('../controllers/lenderController');

const router = express.Router();

router.use(protect);
router.use(authorize(ROLES.LENDER));

router.get('/dashboard', getDashboard);
router.get('/loans', getLoans);
router.get('/payments/:loanId', getLoanPayments);
router.get('/profile', getProfile);

module.exports = router;