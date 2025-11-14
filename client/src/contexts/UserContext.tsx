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

// Cache key for user data (persists even after logout)
const USER_CACHE_KEY = 'cached_user_data';
const USER_CACHE_TIMESTAMP_KEY = 'cached_user_timestamp';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Helper functions for cache management
const getUserFromCache = (): User | null => {
  try {
    const cachedData = localStorage.getItem(USER_CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(USER_CACHE_TIMESTAMP_KEY);
    
    if (cachedData && cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();
      
      // Check if cache is still valid (within 7 days)
      if (now - timestamp < CACHE_DURATION) {
        return JSON.parse(cachedData);
      } else {
        // Cache expired, remove it
        localStorage.removeItem(USER_CACHE_KEY);
        localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
      }
    }
  } catch (error) {
    console.error('Error reading user cache:', error);
    localStorage.removeItem(USER_CACHE_KEY);
    localStorage.removeItem(USER_CACHE_TIMESTAMP_KEY);
  }
  return null;
};

const saveUserToCache = (userData: User | null) => {
  try {
    if (userData) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
      localStorage.setItem(USER_CACHE_TIMESTAMP_KEY, Date.now().toString());
      // Dispatch event to notify other components that user data was updated
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
    }
  } catch (error) {
    console.error('Error saving user cache:', error);
  }
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Load from cache immediately for instant display
  const [user, setUserState] = useState<User | null>(() => getUserFromCache());
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
              saveUserToCache(response); // Update cache with fresh data
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
                saveUserToCache(response); // Update cache with fresh data
              }
            } else {
              // Refresh failed, clear tokens but keep cached user data
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
          }
        } else {
          // No tokens, but we might have cached user data (already loaded)
          // Keep the cached data for display purposes
        }
      } catch (error) {
        console.error('Error loading user from tokens:', error);
        // Clear corrupted tokens but keep cached user data
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
    saveUserToCache(userData); // Update cache whenever user is set
  };

  const login = (userData: User) => {
    setUser(userData); // This will also save to cache
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
      
      // Set user in context and cache
      setUser(response.user); // This will also save to cache
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
      
      // Set user in context and cache
      setUser(response.user); // This will also save to cache
    } else {
      throw new Error(response.message || 'Signup failed');
    }
  };

  const logout = () => {
    // Clear tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Clear session storage but KEEP cached user data (as requested)
    // This allows user data to persist even after logout
    sessionStorage.clear();
    
    // Reset user state (but cache remains for next login)
    setUserState(null);
    
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
        saveUserToCache(response); // Update cache with fresh data
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