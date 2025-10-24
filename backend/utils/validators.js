const mongoose = require('mongoose');

class Validators {
  static isMongoId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static isPhoneNumber(phone) {
    const phoneRegex = /^[6-9]\d{9}$/; // Indian phone numbers
    return phoneRegex.test(phone);
  }

  static isUPIId(upiId) {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,49}@[a-zA-Z]{2,}$/;
    return upiRegex.test(upiId);
  }

  static isEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isStrongPassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }

  static isAmount(amount) {
    return !isNaN(amount) && parseFloat(amount) > 0;
  }

  static isFutureDate(date) {
    return new Date(date) > new Date();
  }

  static isPastDate(date) {
    return new Date(date) < new Date();
  }

  static validateLoanTerms(principal, days, emiPerDay) {
    const totalPayable = emiPerDay * days;
    const tolerance = 0.01; // 1% tolerance for floating point calculations
    
    return Math.abs(totalPayable - principal) <= tolerance;
  }

  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return input;
  }

  static validateFileType(mimetype, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) {
    return allowedTypes.includes(mimetype);
  }

  static validateFileSize(size, maxSizeInMB = 5) {
    return size <= maxSizeInMB * 1024 * 1024;
  }
}

module.exports = Validators;