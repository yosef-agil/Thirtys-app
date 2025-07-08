import { create } from 'zustand';
import { authService } from "@/services/authService";

import { create } from 'zustand';
import { authService } from '../services/authService';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  admin: null,
  
  login: async (credentials) => {
    try {
      const response = await authService.login(credentials);
      
      if (response.success) {
        set({ 
          isAuthenticated: true, 
          admin: response.admin 
        });
        return { success: true };
      }
      
      return { 
        success: false, 
        error: response.error || 'Login failed' 
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
    authService.logout();
    set({ isAuthenticated: false, admin: null });
  },
  
  checkAuth: () => {
    const isAuth = authService.isAuthenticated();
    if (isAuth) {
      const adminData = localStorage.getItem('admin');
      if (adminData) {
        set({ 
          isAuthenticated: true, 
          admin: JSON.parse(adminData) 
        });
      }
    }
  },
}));

export default useAuthStore;