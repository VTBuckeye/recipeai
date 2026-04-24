// User API service
import api from '../config/api';
import { User } from '../types';

export const userService = {
  // Get current user
  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me');
    // Backend returns { status: 'success', data: { user } }
    return response.data.data.user;
  },

  // Update user profile
  updateProfile: async (data: { name?: string; email?: string }): Promise<User> => {
    const response = await api.patch('/users/me', data);
    // Backend returns { status: 'success', data: { user } }
    return response.data.data.user;
  },

  // Upload profile picture
  uploadProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await api.post('/users/me/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    // Backend returns { status: 'success', data: { user } }
    return response.data.data.user;
  },

  // Delete account
  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
  }
};
