const Loan = require('../models/Loan');
const Payment = require('../models/Payment');
const Lender = require('../models/Lender');
const  notificationService  = require('./notificationService');
const mongoose = require('mongoose');

class PaymentService {
  async approvePayment(paymentId, adminId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const payment = await Payment.findById(paymentId).session(session);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'pending') {
        throw new Error('Payment already processed');
      }

      let loan = await Loan.findById(payment.loanId).session(session);
      if (!loan) {
        // Fallback: try finding by loanId string if stored as string
        loan = await Loan.findOne({ loanId: payment.loanId }).session(session);
      }
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Update payment status
      payment.status = 'approved';
      payment.adminId = adminId;
      payment.adminApprovalDate = new Date();
      await payment.save({ session });

      // Update loan details
      loan.totalAmountRepaid += payment.amount;
      loan.remainingBalance -= payment.amount;
      
      // Advance next due date
      const newDueDate = new Date(loan.nextDueDate);
      newDueDate.setDate(newDueDate.getDate() + payment.forDays);
      loan.nextDueDate = newDueDate;

      // Check if loan is fully paid
      if (loan.remainingBalance <= 0) {
        loan.status = 'closed';
        
        // Update lender's active loans count
        await Lender.findByIdAndUpdate(
          loan.lenderId,
          { $inc: { activeLoansCount: -1 } },
          { session }
        );
      }

      await loan.save({ session });

      // Update lender's earnings
      await Lender.findByIdAndUpdate(
        loan.lenderId,
        { $inc: { totalEarnings: payment.amount } },
        { session }
      );

      await session.commitTransaction();

      // Send notifications
      //await notificationService.sendPaymentApprovalNotification(payment, loan);

      return { payment, loan };
    } catch (error) {
        if (session.inTransaction()) {
          await session.abortTransaction();
      }
      throw(error);
    } finally {
      session.endSession();
    }
  }

  async rejectPayment(paymentId, adminId, rejectionReason) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.status = 'rejected';
    payment.adminId = adminId;
    payment.adminApprovalDate = new Date();
    payment.rejectionReason = rejectionReason;
    
    await payment.save();

    //await notificationService.sendPaymentRejectionNotification(payment, rejectionReason);

    return payment;
  }
}

module.exports = new PaymentService();