const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/admin', require('./admin'));
router.use('/lender', require('./lender'));
router.use('/borrower', require('./borrower'));
router.use('/loans', require('./loans'));
router.use('/payments', require('./payments'));
router.use('/upload', require('./upload'));

module.exports = router;