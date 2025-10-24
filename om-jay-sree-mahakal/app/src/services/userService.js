import api from './api';

class UserService {
  // Get user details by profile ID and role
  async getUserDetailsByProfile(profileId, role) {
    try {
      const response = await api.get(`/admin/users`);
      
      // Since our backend doesn't have a direct endpoint for profile-based lookup,
      // we'll filter the users list to find the matching profile
      const allUsers = response.data.data || [];
      
      // Find the user that has the matching profile
      const userWithProfile = allUsers.find(user => {
        if (user.profile && user.profile._id === profileId) {
          return true;
        }
        return false;
      });

      if (userWithProfile) {
        return {
          success: true,
          data: userWithProfile
        };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user details by user ID (original method)
  async getUserDetails(userId) {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all users with pagination
  async getUsers(filters = {}) {
    try {
      const response = await api.get('/admin/users', { 
        params: filters 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create new user (admin only)
  async createUser(userData) {
    try {
      const response = await api.post('/admin/users', userData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update user status
  async updateUserStatus(userId, isActive) {
    try {
      const response = await api.put(`/admin/users/${userId}/status`, {
        isActive
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Something went wrong');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error('An unexpected error occurred');
    }
  }
}

export default new UserService();