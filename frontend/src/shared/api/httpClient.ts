import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/app/config/env';

// Create axios instance with default config
export const httpClient = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true, // Required for HTTP-only cookie auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add any custom headers or logging
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Requests go through with cookies automatically
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - try to refresh token (but not for auth check/refresh/login endpoints)
    const isAuthCheckOrRefresh = originalRequest.url?.includes('/auth/check') || originalRequest.url?.includes('/auth/refresh');
    const isLoginRequest =
      originalRequest.url?.includes('/student/login') ||
      originalRequest.url?.includes('/company/login') ||
      originalRequest.url?.includes('/admin/login');
    
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthCheckOrRefresh && !isLoginRequest) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await httpClient.post('/api/auth/refresh');
        // Retry the original request
        return httpClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        // Clear local storage
        localStorage.removeItem('user_id');
        localStorage.removeItem('company_id');
        localStorage.removeItem('admin_id');
        localStorage.removeItem('name');
        localStorage.removeItem('userType');
        
        // Only redirect if not already on a visitor page
        if (!window.location.pathname.startsWith('/visitor') && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/visitor/news';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Type-safe API response helper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export default httpClient;
