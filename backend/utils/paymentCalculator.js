class PaymentCalculator {
  static calculateEMI(principal, totalDays, interestRate = 0) {
    // Simple EMI calculation without interest for now
    // You can add interest calculation logic here
    return principal / totalDays;
  }

  static calculateTotalInterest(principal, totalDays, interestRate) {
    // Calculate total interest based on your business logic
    return (principal * interestRate * totalDays) / (365 * 100);
  }

  static calculateDailyEMI(principal, totalDays, interestRate = 0) {
    const totalPayable = principal + this.calculateTotalInterest(principal, totalDays, interestRate);
    return totalPayable / totalDays;
  }

  static validatePaymentAmount(paidAmount, expectedAmount, tolerance = 1) {
    // Allow small tolerance for payment amounts
    return Math.abs(paidAmount - expectedAmount) <= tolerance;
  }

  static calculatePrepaymentAmount(emiPerDay, daysToPrepay) {
    return emiPerDay * daysToPrepay;
  }

  static getPaymentSchedule(loanStartDate, totalDays, emiPerDay) {
    const schedule = [];
    let currentDate = new Date(loanStartDate);
    let remainingBalance = emiPerDay * totalDays;

    for (let day = 1; day <= totalDays; day++) {
      schedule.push({
        dueDate: new Date(currentDate),
        amount: emiPerDay,
        dayNumber: day
      });
      currentDate.setDate(currentDate.getDate() + 1);
      remainingBalance -= emiPerDay;
    }

    return schedule;
  }
}

module.exports = PaymentCalculator;