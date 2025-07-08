// client/src/stores/useAuthStore.js
import { create } from 'zustand';
import api from './api'; // Pastikan import path benar

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials); // Ganti ke /auth/login
    return response.data;
  }
};

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  admin: null,
  
  login: async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('admin', JSON.stringify(response.admin));
        
        set({ 
          isAuthenticated: true, 
          admin: response.admin 
        });
        
        return { success: true };
      }
      
      return { 
        success: false, 
        error: 'Login failed' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Internal server error' 
      };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    set({ isAuthenticated: false, admin: null });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    const adminData = localStorage.getItem('admin');
    
    if (token && adminData) {
      set({ 
        isAuthenticated: true, 
        admin: JSON.parse(adminData) 
      });
      return true;
    }
    
    return false;
  },
}));

export default useAuthStore;