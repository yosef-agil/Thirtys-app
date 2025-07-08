import { create } from 'zustand';
import { authService } from "@/services/authService";

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  
  login: async (credentials) => {
    try {
      const data = await authService.login(credentials);
      set({ user: data.admin, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  },
  
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const isAuth = authService.isAuthenticated();
    set({ isAuthenticated: isAuth });
  },
}));

export default useAuthStore;