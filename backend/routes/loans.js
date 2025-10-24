const express = require('express');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { ROLES } = require('../config/constants');
const { validateLoanCreation, validateMongoId } = require('../middleware/validation');
const {
  createLoan,
  getLoans,
  getLoanDetails,
  updateLoanStatus,
  getBorrowerLoans,
  getLenderLoans,
  searchLoans,
  getLoanStats,
  deleteLoan
} = require('../controllers/loanController');

const router = express.Router();

router.use(protect);

// Admin routes
router.post('/', authorize(ROLES.ADMIN), validateLoanCreation, createLoan);
router.get('/', authorize(ROLES.ADMIN), getLoans);
router.get('/search', authorize(ROLES.ADMIN), searchLoans);
router.get('/stats/overview', authorize(ROLES.ADMIN), getLoanStats);
router.get('/:id', authorize(ROLES.ADMIN), validateMongoId, getLoanDetails);
router.put('/:id/status', authorize(ROLES.ADMIN), validateMongoId, updateLoanStatus);
router.delete('/:id', authorize(ROLES.ADMIN), validateMongoId, deleteLoan);

// Borrower routes
router.get('/borrower/my-loans', authorize(ROLES.BORROWER), getBorrowerLoans);

// Lender routes
router.get('/lender/my-loans', authorize(ROLES.LENDER), getLenderLoans);

module.exports = router;