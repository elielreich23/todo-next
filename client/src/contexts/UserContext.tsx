"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { api, refreshToken } from '../lib/api';
import { supabase } from '../lib/supabase';
import { getCachedUserData, setCachedUserData, clearCachedUserData, getStorageItem } from '../utils/storage';
import { CACHE_DURATION, CUSTOM_EVENTS, STORAGE_KEYS, API_ENDPOINTS } from '../constants';
import { setAccessToken, setRefreshToken, clearAuthTokens, getAccessToken, getRefreshToken } from '../utils/storage';

// -------------------- TYPES --------------------

interface User {
  id: number | string;
  username: string;
  email: string;
  full_name: string;
  phone_number?: string;
  bio?: string;
  notification_preferences?: Record<string, boolean>;
}

interface AuthTokens {
  access: string;
  refresh: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: AuthTokens;
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
  googleAuth: (token: string) => Promise<void>;
  validateSession: () => Promise<boolean>;
}

interface UserProviderProps {
  children: ReactNode;
}

// -------------------- HELPER FUNCTIONS --------------------

/**
 * Retrieves user from cache with expiration check
 */
const getUserFromCache = (): User | null => {
  try {
    const cachedUser = getCachedUserData<User>();
    if (!cachedUser) return null;

    const cachedTimestamp = getStorageItem(STORAGE_KEYS.CACHED_USER_TIMESTAMP);
    if (!cachedTimestamp) return null;

    const timestamp = parseInt(cachedTimestamp, 10);
    const now = Date.now();
    const isCacheValid = now - timestamp < CACHE_DURATION.USER_DATA;

    if (isCacheValid) {
      return cachedUser;
    }

    clearCachedUserData();
    return null;
  } catch (error) {
    console.error('Error reading user cache:', error);
    clearCachedUserData();
    return null;
  }
};

/**
 * Saves user data to cache
 */
const saveUserToCache = (userData: User | null): void => {
  if (userData) {
    setCachedUserData(userData);
  }
};

const mapSupabaseUser = (supabaseUser: any): User | null => {
  if (!supabaseUser) {
    return null;
  }

  const displayName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split('@')[0] ||
    'User';

  return {
    id: supabaseUser.id,
    username: supabaseUser.email?.split('@')[0] || supabaseUser.id,
    email: supabaseUser.email || '',
    full_name: displayName,
  };
};

/**
 * Stores authentication tokens
 */
const storeAuthTokens = (tokens: AuthTokens): void => {
  setAccessToken(tokens.access);
  setRefreshToken(tokens.refresh);
};

/**
 * Attempts to fetch user profile from API
 */
const fetchUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api<User>(API_ENDPOINTS.AUTH.PROFILE);
    return response || null;
  } catch (error) {
    return null;
  }
};

/**
 * Attempts to refresh token and fetch user profile
 */
const refreshTokenAndFetchProfile = async (): Promise<User | null> => {
  const newAccessToken = await refreshToken();
  if (!newAccessToken) {
    return null;
  }

  return fetchUserProfile();
};

/**
 * Loads user profile with token refresh fallback
 */
const loadUserProfileWithRefresh = async (): Promise<User | null> => {
  const profile = await fetchUserProfile();
  if (profile) {
    return profile;
  }

  return refreshTokenAndFetchProfile();
};

// -------------------- CONTEXT --------------------

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// -------------------- PROVIDER --------------------

const hasPersistedSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(getAccessToken() && getRefreshToken() && getUserFromCache());
};

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => getUserFromCache());
  const [isLoading, setIsLoading] = useState(() => !hasPersistedSession());

  /**
   * Updates user state and cache
   */
  const setUser = useCallback((userData: User | null) => {
    setUserState(userData);
    saveUserToCache(userData);
  }, []);

  /**
   * Handles authentication response by storing tokens and setting user
   */
  const handleAuthResponse = useCallback((response: AuthResponse) => {
    if (!response.success) {
      throw new Error(response.message || 'Authentication failed');
    }

    storeAuthTokens(response.tokens);
    setUser(response.user);
  }, [setUser]);

  /**
   * Loads user from tokens with fallback to cache
   */
  useEffect(() => {
    const loadUserFromTokens = async () => {
      try {
        const accessToken = getAccessToken();
        const refreshTokenValue = getRefreshToken();
        const cachedUser = getUserFromCache();

        if (accessToken && refreshTokenValue) {
          const profile = await loadUserProfileWithRefresh();

          if (profile) {
            setUserState(profile);
            saveUserToCache(profile);
          } else if (cachedUser) {
            setUserState(cachedUser);
          }
        } else if (cachedUser) {
          setUserState(prev => prev || cachedUser);
        } else if (!accessToken && supabase) {
          const { data } = await supabase.auth.getSession();
          const supabaseUser = mapSupabaseUser(data.session?.user);

          if (supabaseUser) {
            setUserState(supabaseUser);
            saveUserToCache(supabaseUser);
            return;
          }

          clearAuthTokens();
        }
      } catch (error) {
        console.error('Error loading user from tokens:', error);
        const cachedUser = getUserFromCache();

        if (cachedUser) {
          setUserState(cachedUser);
        } else if (!getAccessToken()) {
          clearAuthTokens();
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromTokens();
  }, [setUser]);

  /**
   * Local login - sets user data directly
   */
  const login = useCallback((userData: User) => {
    setUser(userData);
  }, [setUser]);

  /**
   * Remote login with email and password
   */
  const remoteLogin = useCallback(async (params: { email: string; password: string }) => {
    const response = await api<AuthResponse>(API_ENDPOINTS.AUTH.SIGNIN, {
      method: 'POST',
      body: JSON.stringify(params)
    });

    handleAuthResponse(response);
  }, [handleAuthResponse]);

  /**
   * Remote signup
   */
  const remoteSignup = useCallback(async (params: {
    username: string;
    email: string;
    full_name: string;
    password: string;
    password_confirm: string;
  }) => {
    const response = await api<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(params)
    });

    handleAuthResponse(response);
  }, [handleAuthResponse]);

  /**
   * Google OAuth authentication
   */
  const googleAuth = useCallback(async (token: string) => {
    const response = await api<AuthResponse>(API_ENDPOINTS.AUTH.GOOGLE_AUTH, {
      method: 'POST',
      body: JSON.stringify({ token })
    });

    handleAuthResponse(response);
  }, [handleAuthResponse]);

  /**
   * Logout - clears tokens and user data
   */
  const logout = useCallback(async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (refreshTokenValue) {
        try {
          await api(API_ENDPOINTS.AUTH.LOGOUT, {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshTokenValue }),
          });
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      if (supabase) {
        await supabase.auth.signOut();
      }
      clearAuthTokens();
      sessionStorage.clear();
      localStorage.removeItem('session_id');

      setUserState(null);
      clearCachedUserData();

      window.dispatchEvent(new CustomEvent(CUSTOM_EVENTS.USER_LOGOUT));
    }
  }, []);

  /**
   * Validates current session
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const accessToken = getAccessToken();
      const refreshTokenValue = getRefreshToken();

      if (!accessToken || !refreshTokenValue) {
        if (!supabase) {
          return false;
        }

        const { data } = await supabase.auth.getSession();
        const supabaseUser = mapSupabaseUser(data.session?.user);

        if (supabaseUser) {
          setUserState(supabaseUser);
          saveUserToCache(supabaseUser);
          return true;
        }

        return false;
      }

      const profile = await fetchUserProfile();
      if (profile) {
        setUserState(profile);
        saveUserToCache(profile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Session validation failed:', error);
      await logout();
      return false;
    }
  }, [logout]);

  const value: UserContextType = useMemo(() => ({
    user,
    setUser,
    login,
    logout,
    isAuthenticated: !!user,
    isLoading,
    remoteLogin,
    remoteSignup,
    googleAuth,
    validateSession,
  }), [user, isLoading, setUser, login, logout, remoteLogin, remoteSignup, googleAuth, validateSession]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
