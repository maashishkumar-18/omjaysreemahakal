import api from './api';

export const adminService = {
  createUser: async (userData) => {
    console.log('adminService.createUser called with:', userData);
    try {
      const response = await api.post('/admin/users', userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('adminService.createUser response:', response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUsers: async (filters = {}) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  getUserDetails: async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await api.put(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  deleteUser: async (userId) => {
    console.log('adminService.deleteUser called with userId:', userId);
    const response = await api.delete(`/admin/users/${userId}`);
    console.log('adminService.deleteUser response:', response);
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getPendingPayments: async () => {
    const response = await api.get('/admin/payments/pending');
    return response.data;
  },

  approvePayment: async (paymentId) => {
    const response = await api.put(`/admin/payments/${paymentId}/approve`);
    return response.data;
  },

  rejectPayment: async (paymentId, rejectionReason) => {
    const response = await api.put(`/admin/payments/${paymentId}/reject`, { rejectionReason });
    return response.data;
  },

  getAuditLogs: async (filters = {}) => {
    const response = await api.get('/admin/audit-logs', { params: filters });
    return response.data;
  },
};