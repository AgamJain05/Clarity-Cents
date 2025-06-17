import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isPremium: boolean;
  joinDate: string;
  preferences: {
    currency: string;
    notifications: boolean;
    biometricAuth: boolean;
    darkMode: boolean;
    language: string;
  };
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  state: AuthState;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<User['preferences']>) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resetPassword: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const STORAGE_KEYS = {
  USER: 'finance_tracker_user',
  AUTH_TOKEN: 'finance_tracker_token',
};

// Mock users for demo (in real app, this would be handled by backend)
const MOCK_USERS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    password: 'password123',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&dpr=2&fit=crop&crop=face',
    isPremium: true,
    joinDate: '2024-01-15',
    preferences: {
      currency: 'USD',
      notifications: true,
      biometricAuth: false,
      darkMode: false,
      language: 'en',
    },
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john.doe@email.com',
    password: 'password123',
    isPremium: false,
    joinDate: '2024-03-10',
    preferences: {
      currency: 'USD',
      notifications: true,
      biometricAuth: false,
      darkMode: false,
      language: 'en',
    },
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);
  const initializeAuth = async () => {
    try {
      const response = await ApiService.verifyToken();
      
      if (response.success && response.data?.user) {
        setState({
          user: response.data.user,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await ApiService.login(email, password);
      
      if (response.success && response.data?.user) {
        const user = response.data.user;
        
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        return true;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };
  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await ApiService.register(name, email, password);
      
      if (response.success && response.data?.user) {
        const user = response.data.user;
        
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });

        return true;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };
  const logout = async (): Promise<void> => {
    try {
      console.log('🟡 AUTH CONTEXT STEP 1: logout function called');
      console.log('🟡 Current state before logout:', {
        isAuthenticated: state.isAuthenticated,
        user: state.user?.email,
        isLoading: state.isLoading
      });
      
      setState(prev => ({ ...prev, isLoading: true }));
      console.log('🟡 AUTH CONTEXT STEP 2: Set loading to true');

      // Call logout API to invalidate token on server
      try {
        console.log('🟡 AUTH CONTEXT STEP 3: Calling ApiService.logout()...');
        await ApiService.logout();
        console.log('🟡 AUTH CONTEXT STEP 4: ApiService.logout() completed successfully');
      } catch (error) {
        // Even if API call fails, we should still clear local state
        console.warn('🟡 AUTH CONTEXT STEP 4: Logout API call failed, but continuing with local logout:', error);
      }

      // Clear authentication state
      console.log('🟡 AUTH CONTEXT STEP 5: Clearing authentication state...');
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      console.log('🟡 AUTH CONTEXT STEP 6: Authentication state cleared successfully');
      console.log('🟡 AUTH CONTEXT STEP 7: Layout will handle routing to login page');
    } catch (error) {
      console.error('🟡 AUTH CONTEXT ERROR: Logout error:', error);
      // Even if there's an error, clear the auth state
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      console.log('🟡 AUTH CONTEXT STEP 6 (ERROR): Authentication state cleared after error');
      console.log('🟡 AUTH CONTEXT STEP 7 (ERROR): Layout will handle routing to login page');
    }
  };
  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      if (!state.user) return;

      const response = await ApiService.updateUserProfile(updates);
      
      if (response.success && response.data?.user) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
        }));
      }
    } catch (error) {
      console.error('Update profile error:', error);
    }
  };

  const updatePreferences = async (preferences: Partial<User['preferences']>): Promise<void> => {
    try {
      if (!state.user) return;

      const response = await ApiService.updateUserPreferences(preferences);
      
      if (response.success && response.data?.user) {
        setState(prev => ({
          ...prev,
          user: response.data.user,
        }));
      }
    } catch (error) {
      console.error('Update preferences error:', error);
    }
  };
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const response = await ApiService.forgotPassword(email);
      return response.success;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  };

  const deleteAccount = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // For now, just logout (in a real app, you'd call a delete API)
      await ApiService.logout();

      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Delete account error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const contextValue: AuthContextType = {
    state,
    login,
    register,
    logout,
    updateProfile,
    updatePreferences,
    deleteAccount,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}