const { body, validationResult, param } = require('express-validator');
const { responseHandler } = require('../utils/responseHandler');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User creation validation
const validateUserCreation = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .isAlphanumeric()
    .withMessage('Username can only contain letters and numbers'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .isIn(['lender', 'borrower'])
    .withMessage('Role must be either lender or borrower'),
  
  body('name')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phoneNumber')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  handleValidationErrors
];

// Borrower-specific validation
const validateBorrowerCreation = [
  body('address')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  handleValidationErrors
];

// Lender-specific validation
const validateLenderCreation = [
  body('upiId')
    .isLength({ min: 5, max: 50 })
    .withMessage('UPI ID must be between 5 and 50 characters'),
  
  handleValidationErrors
];

// Loan creation validation
const validateLoanCreation = [
  body('principalAmount')
    .isFloat({ min: 1 })
    .withMessage('Principal amount must be a positive number'),
  
  body('totalDays')
    .isInt({ min: 1, max: 3650 }) // Max 10 years
    .withMessage('Total days must be between 1 and 3650'),
  
  body('emiPerDay')
    .isFloat({ min: 1 })
    .withMessage('EMI per day must be a positive number'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('borrowerId')
    .isMongoId()
    .withMessage('Invalid borrower ID'),
  
  body('lenderId')
    .isMongoId()
    .withMessage('Invalid lender ID'),
  
  handleValidationErrors
];

// Payment submission validation
const validatePaymentSubmission = [
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('forDays')
    .isInt({ min: 1 })
    .withMessage('For days must be a positive integer'),
  
  body('utrNumber')
    .optional()
    .isLength({ min: 8, max: 20 })
    .withMessage('UTR number must be between 8 and 20 characters'),
  
  handleValidationErrors
];

// Payment approval/rejection validation
const validatePaymentAction = [
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting a payment'),
  
  handleValidationErrors
];

// MongoDB ID validation
const validateMongoId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserCreation,
  validateBorrowerCreation,
  validateLenderCreation,
  validateLoanCreation,
  validatePaymentSubmission,
  validatePaymentAction,
  validateMongoId
};