import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1a237e', // Deep blue
    accent: '#ff6f00', // Orange
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#212121',
    error: '#d32f2f',
    success: '#388e3c',
    warning: '#f57c00',
    info: '#1976d2',
  },
  roundness: 8,
};

export const ROLES = {
  ADMIN: 'admin',
  LENDER: 'lender',
  BORROWER: 'borrower',
};

export const LOAN_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  DEFAULTED: 'defaulted',
  PENDING: 'pending',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const API_BASE_URL = 'http://localhost:5000/api'; // Update with your backend URL