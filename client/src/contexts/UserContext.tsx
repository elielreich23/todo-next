"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, refreshToken } from '../lib/api';
import { getCachedUserData, setCachedUserData, clearCachedUserData, getStorageItem } from '../utils/storage';
import { CACHE_DURATION, CUSTOM_EVENTS, STORAGE_KEYS, API_ENDPOINTS } from '../constants';
import { setAccessToken, setRefreshToken, clearAuthTokens, getAccessToken, getRefreshToken } from '../utils/storage';

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

// Helper function to get user from cache with expiration check
const getUserFromCache = (): User | null => {
  try {
    const cachedUser = getCachedUserData<User>();
    if (!cachedUser) return null;

    // Check cache expiration
    const cachedTimestamp = getStorageItem(STORAGE_KEYS.CACHED_USER_TIMESTAMP);

    if (cachedTimestamp) {
      const timestamp = parseInt(cachedTimestamp, 10);
      const now = Date.now();

      if (now - timestamp < CACHE_DURATION.USER_DATA) {
        return cachedUser;
      } else {
        // Cache expired, remove it
        clearCachedUserData();
      }
    }
  } catch (error) {
    console.error('Error reading user cache:', error);
    clearCachedUserData();
  }
  return null;
};

const saveUserToCache = (userData: User | null) => {
  if (userData) {
    setCachedUserData(userData);
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
        const accessToken = getAccessToken();
        const refreshTokenValue = getRefreshToken();

        if (accessToken && refreshTokenValue) {
          // Get current cached user to preserve it if API calls fail
          const cachedUser = getUserFromCache();

          // Try to get user profile
          try {
            const response = await api<User>(API_ENDPOINTS.AUTH.PROFILE);
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
              try {
                const response = await api<User>(API_ENDPOINTS.AUTH.PROFILE);
                if (response) {
                  setUserState(response);
                  saveUserToCache(response); // Update cache with fresh data
                }
              } catch (refreshError) {
                // Even after refresh, profile fetch failed
                // Keep cached user if available - don't clear user data
                if (cachedUser) {
                  setUserState(cachedUser);
                }
              }
            } else {
              // Refresh failed, but keep user data if we have it
              // Don't clear tokens or user data - keep what we have
              if (cachedUser) {
                setUserState(cachedUser);
              }
            }
          }
        } else {
          // No tokens, but we might have cached user data (already loaded in initial state)
          // Keep the cached data for display purposes - don't clear it
          const cachedUser = getUserFromCache();
          if (cachedUser) {
            // If we have cache, ensure it's in state
            setUserState(prev => prev || cachedUser);
          }
        }
      } catch (error) {
        console.error('Error loading user from tokens:', error);
        // Don't clear user data on error - keep what we have
        const cachedUser = getUserFromCache();
        if (cachedUser) {
          setUserState(cachedUser);
        }
        // Only clear tokens if we really have no user data at all
        if (!cachedUser) {
          const accessToken = getAccessToken();
          if (!accessToken) {
            clearAuthTokens();
          }
        }
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
    const response = await api<LoginResponse>(API_ENDPOINTS.AUTH.SIGNIN, {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (response.success) {
      // Store tokens
      setAccessToken(response.tokens.access);
      setRefreshToken(response.tokens.refresh);

      // Set user in context and cache
      setUser(response.user); // This will also save to cache
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const remoteSignup = async (params: { username: string; email: string; full_name: string; password: string; password_confirm: string }) => {
    const response = await api<SignupResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (response.success) {
      // Store tokens
      setAccessToken(response.tokens.access);
      setRefreshToken(response.tokens.refresh);

      // Set user in context and cache
      setUser(response.user); // This will also save to cache
    } else {
      throw new Error(response.message || 'Signup failed');
    }
  };

  const logout = () => {
    // Clear tokens
    clearAuthTokens();

    // Clear session storage but KEEP cached user data (as requested)
    // This allows user data to persist even after logout
    sessionStorage.clear();

    // Reset user state (but cache remains for next login)
    setUserState(null);

    // Dispatch custom event to notify other contexts
    window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();

      if (!accessToken || !refreshTokenValue) {
        return false;
      }

      // Try to get user profile to validate session
      const response = await api<User>(API_ENDPOINTS.AUTH.PROFILE);
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
