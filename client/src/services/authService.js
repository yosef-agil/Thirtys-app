import api from './api';

export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data;
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('admin', JSON.stringify(data.admin));
      }
      
      return data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};