// client/src/stores/useAuthStore.js
import { create } from 'zustand';
import api from '../services/api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  }
};

const useAuthStore = create((set, get) => ({
  isAuthenticated: false,
  admin: null,
  
  // Initialize auth state from localStorage
  initializeAuth: () => {
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
        error: error.response?.data?.error || error.message || 'Internal server error' 
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
    
    set({ isAuthenticated: false, admin: null });
    return false;
  },
}));

// Initialize auth on store creation
useAuthStore.getState().initializeAuth();

export default useAuthStore;