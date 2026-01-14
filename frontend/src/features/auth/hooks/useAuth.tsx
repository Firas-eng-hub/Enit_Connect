import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import httpClient from '@/shared/api/httpClient';

export type UserType = 'student' | 'company' | 'admin' | null;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  userType: UserType;
  user: AuthUser | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (userType: 'student' | 'company' | 'admin', credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  userName: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userType: null,
    user: null,
    isLoading: true,
  });

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/auth/check');
      const { authenticated, userType, user } = response.data;
      
      setState({
        isAuthenticated: authenticated,
        userType: userType || null,
        user: user || null,
        isLoading: false,
      });

      // Sync with localStorage
      if (authenticated && userType) {
        localStorage.setItem('userType', userType);
        if (user) {
          localStorage.setItem('name', user.name);
          const idKey = userType === 'student' ? 'user_id' : userType === 'company' ? 'company_id' : 'admin_id';
          localStorage.setItem(idKey, user.id);
        }
      }
    } catch {
      // Not authenticated or error - clear everything
      setState({
        isAuthenticated: false,
        userType: null,
        user: null,
        isLoading: false,
      });
      
      // Clear localStorage on auth failure
      localStorage.removeItem('user_id');
      localStorage.removeItem('company_id');
      localStorage.removeItem('admin_id');
      localStorage.removeItem('name');
      localStorage.removeItem('userType');
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (
    userType: 'student' | 'company' | 'admin',
    credentials: { email: string; password: string }
  ) => {
    const endpoints = {
      student: '/api/student/login',
      company: '/api/company/login',
      admin: '/api/admin/login',
    };

    const response = await httpClient.post(endpoints[userType], credentials);
    const { id, email, name } = response.data;

    // Update state
    setState({
      isAuthenticated: true,
      userType,
      user: { id, email, name },
      isLoading: false,
    });

    // Store in localStorage (NOT tokens - those are HTTP-only cookies)
    const idKeys = {
      student: 'user_id',
      company: 'company_id',
      admin: 'admin_id',
    };
    localStorage.setItem(idKeys[userType], id);
    localStorage.setItem('name', name);
    localStorage.setItem('userType', userType);
  };

  // Logout function
  const logout = async () => {
    try {
      await httpClient.post('/api/auth/logout');
    } catch {
      // Logout anyway on error
    }

    // Clear state
    setState({
      isAuthenticated: false,
      userType: null,
      user: null,
      isLoading: false,
    });

    // Clear localStorage
    localStorage.removeItem('user_id');
    localStorage.removeItem('company_id');
    localStorage.removeItem('admin_id');
    localStorage.removeItem('name');
    localStorage.removeItem('userType');
  };

  // Computed userName
  const userName = state.user?.name || '';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, checkAuth, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
