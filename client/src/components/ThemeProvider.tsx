"use client";

import React, { useEffect, useState, useCallback } from 'react';

// -------------------- CONSTANTS --------------------

const THEME_STORAGE_KEY = 'dashboard-theme';
const THEME_CLASS_DARK = 'dark-mode';
const THEME_CLASS_LIGHT = 'light-mode';

type Theme = 'light' | 'dark';

interface ThemeProviderProps {
  children: React.ReactNode;
}

// -------------------- HELPER FUNCTIONS --------------------

/**
 * Retrieves theme from localStorage
 */
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' || stored === 'light' ? stored : 'light';
};

/**
 * Validates if a value is a valid theme
 */
const isValidTheme = (value: string | null): value is Theme => {
  return value === 'dark' || value === 'light';
};

// -------------------- COMPONENT --------------------

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  /**
   * Handles storage events from other tabs/windows
   */
  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY && isValidTheme(e.newValue)) {
      setTheme(e.newValue);
    }
  }, []);

  /**
   * Syncs theme with localStorage on mount
   */
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored !== theme) {
      setTheme(stored);
    }
  }, [theme]);

  /**
   * Listens for storage events
   */
  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleStorageChange]);

  const themeClass = theme === 'dark' ? THEME_CLASS_DARK : THEME_CLASS_LIGHT;

  return (
    <div className={themeClass} data-theme={theme}>
      {children}
    </div>
  );
}
