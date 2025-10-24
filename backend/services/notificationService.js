const { emailService } = require('./emailService');

class NotificationService {
  async sendPaymentApprovalNotification(payment, loan) {
    // Send email notification
    await emailService.sendPaymentApprovalNotification(payment, loan);
    
    // Here you can add other notification methods:
    // - SMS notifications
    // - Push notifications
    // - In-app notifications
    
    console.log(`Payment approved notification sent for payment ${payment._id}`);
  }

  async sendPaymentRejectionNotification(payment, rejectionReason) {
    // Send email notification
    await emailService.sendPaymentRejectionNotification(payment, rejectionReason);
    
    // Add other notification methods here
    
    console.log(`Payment rejection notification sent for payment ${payment._id}`);
  }

  async sendLoanCreatedNotification(loan, borrower, lender) {
    // Notify borrower and lender about new loan
    console.log(`Loan created notification sent for loan ${loan.loanId}`);
  }

  async sendDueDateReminder(loan, daysUntilDue) {
    // Send reminder notifications before due date
    console.log(`Due date reminder sent for loan ${loan.loanId}`);
  }
}

module.exports = new NotificationService();