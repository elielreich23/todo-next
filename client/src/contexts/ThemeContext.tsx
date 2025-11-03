"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('dashboard-theme');
      return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme as Theme : 'light';
    }
    return 'light';
  });

  // Apply theme to document globally
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Remove all theme classes first
    root.classList.remove('dark-mode', 'light-mode');
    body.classList.remove('dark-mode', 'light-mode');
    
    // Add appropriate theme classes
    if (theme === 'dark') {
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    } else {
      root.classList.add('light-mode');
      body.classList.add('light-mode');
    }

    // Update any dashboard elements
    const dashboardEls = document.querySelectorAll('.dashboard');
    dashboardEls.forEach((el) => {
      el.classList.remove('dark-mode', 'light-mode');
      el.classList.add(theme === 'dark' ? 'dark-mode' : 'light-mode');
    });

    // Save to localStorage
    localStorage.setItem('dashboard-theme', theme);
  }, [theme]);

  // Listen for storage changes (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue as Theme);
      }
    };

    // Listen for custom theme-change events
    const handleThemeChange = (e: CustomEvent) => {
      if (e.detail === 'dark' || e.detail === 'light') {
        setThemeState(e.detail as Theme);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('theme-change', handleThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('theme-change', handleThemeChange as EventListener);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    // Dispatch custom event for immediate update
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

