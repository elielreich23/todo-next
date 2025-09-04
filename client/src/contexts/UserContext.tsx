"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
  username: string;
  email: string;
  fullName: string;
  id?: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean; // Add loading state
  remoteLogin?: (params: { username?: string; email?: string }) => Promise<void>;
  remoteSignup?: (params: { username: string; email: string; fullName?: string }) => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Initialize loading state

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        console.log('Loading user from localStorage...');
        const storedUser = localStorage.getItem('taskero_user');
        console.log('Stored user data:', storedUser);
        
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log('Parsed user data:', userData);
          setUserState(userData);
          setIsAuthenticated(true);
        } else {
          console.log('No stored user data found');
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
        // Clear corrupted data
        localStorage.removeItem('taskero_user');
      } finally {
        console.log('Setting loading to false');
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Save user data to localStorage whenever 
  const setUser = (userData: User | null) => {
    setUserState(userData);
    setIsAuthenticated(!!userData);
    
    if (userData) {
      localStorage.setItem('taskero_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('taskero_user');
    }
  };

  const login = (userData: User) => {
    console.log('Login called with user data:', userData);
    setUser(userData);
  };

  // Call backend to login (mock: username or email only)
  const remoteLogin = async (params: { username?: string; email?: string }) => {
    const userData = await api<User>('/api/auth/login', { method: 'POST', body: JSON.stringify(params) });
    setUser(userData);
  };

  const remoteSignup = async (params: { username: string; email: string; fullName?: string }) => {
    const userData = await api<User>('/api/auth/signup', { method: 'POST', body: JSON.stringify(params) });
    setUser(userData);
  };

  const logout = () => {
    console.log('Logout called - clearing user data');
    // Clear user state
    setUserState(null);
    setIsAuthenticated(false);
    // Clear localStorage
    localStorage.removeItem('taskero_user');
    console.log('User data cleared, localStorage cleared');
  };

  const value: UserContextType = {
    user,
    setUser,
    login,
    logout,
    isAuthenticated,
    isLoading,
    remoteLogin,
    remoteSignup,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
