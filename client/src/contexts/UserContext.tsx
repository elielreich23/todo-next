"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, refreshToken } from '../lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

interface SignupResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  remoteLogin: (params: { email: string; password: string }) => Promise<void>;
  remoteSignup: (params: { username: string; email: string; full_name: string; password: string; password_confirm: string }) => Promise<void>;
  validateSession: () => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user from tokens and validate
    const loadUserFromTokens = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const refreshTokenValue = localStorage.getItem('refresh_token');
        
        if (accessToken && refreshTokenValue) {
          // Try to get user profile
          try {
            const response = await api<User>('/api/auth/profile/');
            if (response) {
              setUserState(response);
            }
          } catch (error) {
            // Token might be expired, try to refresh
            console.log('Access token expired, attempting refresh...');
            const newAccessToken = await refreshToken();
            if (newAccessToken) {
              // Try again with new token
              const response = await api<User>('/api/auth/profile/');
              if (response) {
                setUserState(response);
              }
            } else {
              // Refresh failed, clear tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
          }
        }
      } catch (error) {
        console.error('Error loading user from tokens:', error);
        // Clear corrupted data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromTokens();
  }, []);

  const setUser = (userData: User | null) => {
    setUserState(userData);
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const remoteLogin = async (params: { email: string; password: string }) => {
    const response = await api<LoginResponse>('/api/auth/signin/', { 
      method: 'POST', 
      body: JSON.stringify(params) 
    });
    
    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      // Set user in context
      setUser(response.user);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const remoteSignup = async (params: { username: string; email: string; full_name: string; password: string; password_confirm: string }) => {
    const response = await api<SignupResponse>('/api/auth/signup/', { 
      method: 'POST', 
      body: JSON.stringify(params) 
    });
    
    if (response.success) {
      // Store tokens in localStorage
      localStorage.setItem('access_token', response.tokens.access);
      localStorage.setItem('refresh_token', response.tokens.refresh);
      
      // Set user in context
      setUser(response.user);
    } else {
      throw new Error(response.message || 'Signup failed');
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear any cached user data
    localStorage.removeItem('user_data');
    sessionStorage.clear();
    
    // Reset user state
    setUser(null);
    
    // Dispatch custom event to notify other contexts
    window.dispatchEvent(new CustomEvent('userLogout'));
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const accessToken = localStorage.getItem('access_token');
      const refreshTokenValue = localStorage.getItem('refresh_token');
      
      if (!accessToken || !refreshTokenValue) {
        return false;
      }
      
      // Try to get user profile to validate session
      const response = await api<User>('/api/auth/profile/');
      if (response) {
        setUserState(response);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session validation failed:', error);
      logout();
      return false;
    }
  };

  const value: UserContextType = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    remoteLogin,
    remoteSignup,
    validateSession,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};