const Loan = require('../models/Loan');

const generateLoanId = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  // Find the last loan ID for today
  const lastLoan = await Loan.findOne({
    loanId: new RegExp(`^LN-${dateStr}`)
  }).sort({ loanId: -1 });

  let sequence = 1;
  if (lastLoan) {
    const lastSequence = parseInt(lastLoan.loanId.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `LN-${dateStr}-${String(sequence).padStart(3, '0')}`;
};

module.exports = { generateLoanId };