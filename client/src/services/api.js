// client/src/services/api.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD 
    ? 'https://thirtys-code-production.up.railway.app/api'
    : 'http://localhost:8080/api'
);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk menambahkan token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor untuk handle error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if we're on admin pages
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Only clear auth and redirect if we're in admin area
      if (currentPath.startsWith('/admin') && !currentPath.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        window.location.href = '/admin/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;