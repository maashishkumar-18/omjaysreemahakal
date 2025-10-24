const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html
      };

      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendWelcomeEmail(user, password, role) {
    const subject = `Welcome to Money Lending App - Your ${role} Account`;
    const html = `
      <h2>Welcome to Money Lending App!</h2>
      <p>Your ${role} account has been created successfully.</p>
      <p><strong>Username:</strong> ${user.username}</p>
      <p><strong>Password:</strong> ${password}</p>
      <p>Please login to the app and change your password immediately.</p>
      <br>
      <p>Best regards,<br>Money Lending App Team</p>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  async sendPaymentApprovalNotification(payment, loan) {
    const subject = 'Payment Approved Successfully';
    const html = `
      <h2>Payment Approved</h2>
      <p>Your payment of ₹${payment.amount} for loan ${loan.loanId} has been approved.</p>
      <p><strong>Payment Date:</strong> ${payment.paymentDate.toLocaleDateString()}</p>
      <p><strong>Approval Date:</strong> ${payment.adminApprovalDate.toLocaleDateString()}</p>
      <p><strong>Remaining Balance:</strong> ₹${loan.remainingBalance}</p>
      <br>
      <p>Thank you for your timely payment.</p>
    `;

    // This would send to borrower's email (need to store email in borrower model)
    return true;
  }

  async sendPaymentRejectionNotification(payment, rejectionReason) {
    const subject = 'Payment Rejected';
    const html = `
      <h2>Payment Rejected</h2>
      <p>Your payment of ₹${payment.amount} has been rejected.</p>
      <p><strong>Reason:</strong> ${rejectionReason}</p>
      <p>Please contact admin for more details or submit a new payment with correct details.</p>
      <br>
      <p>Best regards,<br>Money Lending App Team</p>
    `;

    // This would send to borrower's email
    return true;
  }
}

module.exports = new EmailService();