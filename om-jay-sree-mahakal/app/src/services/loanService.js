import api from './api';

export const loanService = {
  // Admin services
  createLoan: async (loanData) => {
    const response = await api.post('/loans', loanData);
    return response.data;
  },

  getLoans: async (filters = {}) => {
    const response = await api.get('/loans', { params: filters });
    return response.data;
  },

  getLoanDetails: async (loanId) => {
    const response = await api.get(`/loans/${loanId}`);
    return response.data;
  },

  updateLoanStatus: async (loanId, status, notes) => {
    const response = await api.put(`/loans/${loanId}/status`, { status, notes });
    return response.data;
  },

  deleteLoan: async (loanId) => {
    const response = await api.delete(`/loans/${loanId}`);
    return response.data;
  },

  // Borrower services
  getBorrowerLoans: async () => {
    const response = await api.get('/borrower/loan-details');
    return response.data;
  },

  getLenderQRCode: async () => {
    const response = await api.get('/borrower/lender-qr-code');
    return response.data;
  },

  submitPayment: async (paymentData) => {
    const response = await api.post('/borrower/submit-payment', paymentData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPaymentHistory: async (filters = {}) => {
    console.log('loanService.getPaymentHistory called with filters:', filters);
    const response = await api.get('/borrower/payment-history', { params: filters });
    console.log('loanService.getPaymentHistory response:', response);
    return response.data;
  },

  // Lender services
  getLenderLoans: async (filters = {}) => {
    const response = await api.get('/lender/loans', { params: filters });
    return response.data;
  },

  getLenderDashboard: async () => {
    const response = await api.get('/lender/dashboard');
    return response.data;
  },

  getLoanPayments: async (loanId) => {
    const response = await api.get(`/lender/payments/${loanId}`);
    return response.data;
  },
};