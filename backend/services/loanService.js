const Loan = require('../models/Loan');
const { calculateRemainingDays } = require('../utils/helpers');

class LoanService {
  async updateOverdueLoans() {
    try {
      const today = new Date();
      const overdueLoans = await Loan.find({
        status: 'active',
        nextDueDate: { $lt: today }
      });

      for (const loan of overdueLoans) {
        const daysOverdue = Math.floor((today - loan.nextDueDate) / (1000 * 60 * 60 * 24));
        loan.daysOverdue = daysOverdue;
        
        // Mark as defaulted if overdue by more than 30 days
        if (daysOverdue > 30) {
          loan.status = 'defaulted';
        }
        
        await loan.save();
      }

      return overdueLoans.length;
    } catch (error) {
      console.error('Error updating overdue loans:', error);
      throw error;
    }
  }

  async getLoanSummary(loanId) {
    const loan = await Loan.findById(loanId)
      .populate('borrowerId', 'name phoneNumber')
      .populate('lenderId', 'name phoneNumber');

    if (!loan) {
      throw new Error('Loan not found');
    }

    const payments = await Payment.find({ loanId, status: 'approved' });
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const remainingDays = calculateRemainingDays(loan.endDate);

    return {
      loan,
      summary: {
        totalPaid,
        remainingBalance: loan.remainingBalance,
        remainingDays,
        paymentsCount: payments.length,
        lastPayment: payments[0] || null
      }
    };
  }

  async calculateLoanMetrics() {
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

    return {
      totalLoans,
      activeLoans,
      closedLoans,
      defaultedLoans,
      totalAmountLent: totalAmountLent[0]?.total || 0,
      totalAmountRepaid: totalAmountRepaid[0]?.total || 0
    };
  }
}

module.exports = new LoanService();