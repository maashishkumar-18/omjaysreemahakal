import { createSlice } from '@reduxjs/toolkit';

const loanSlice = createSlice({
  name: 'loans',
  initialState: {
    loans: [],
    activeLoan: null,
    payments: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Loan actions
    fetchLoansStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLoansSuccess: (state, action) => {
      state.loading = false;
      state.loans = action.payload;
      state.error = null;
    },
    fetchLoansFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Active loan actions
    setActiveLoan: (state, action) => {
      state.activeLoan = action.payload;
    },
    clearActiveLoan: (state) => {
      state.activeLoan = null;
    },

    // Payment actions
    fetchPaymentsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchPaymentsSuccess: (state, action) => {
      state.loading = false;
      state.payments = action.payload;
      state.error = null;
    },
    fetchPaymentsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Update loan status
    updateLoanStatus: (state, action) => {
      const { loanId, status } = action.payload;
      const loan = state.loans.find(loan => loan._id === loanId);
      if (loan) {
        loan.status = status;
      }
      if (state.activeLoan && state.activeLoan._id === loanId) {
        state.activeLoan.status = status;
      }
    },

    // Add new payment
    addPayment: (state, action) => {
      state.payments.unshift(action.payload);
    },

    // Update payment status
    updatePaymentStatus: (state, action) => {
      const { paymentId, status } = action.payload;
      const payment = state.payments.find(payment => payment._id === paymentId);
      if (payment) {
        payment.status = status;
      }
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset state
    resetLoans: (state) => {
      state.loans = [];
      state.activeLoan = null;
      state.payments = [];
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  fetchLoansStart,
  fetchLoansSuccess,
  fetchLoansFailure,
  setActiveLoan,
  clearActiveLoan,
  fetchPaymentsStart,
  fetchPaymentsSuccess,
  fetchPaymentsFailure,
  updateLoanStatus,
  addPayment,
  updatePaymentStatus,
  clearError,
  resetLoans,
} = loanSlice.actions;

export default loanSlice.reducer;