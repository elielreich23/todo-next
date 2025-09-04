"use client";

import React, { useEffect, useState } from 'react';

type Props = { children: React.ReactNode };

export default function ThemeProvider({ children }: Props) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (typeof window !== 'undefined' && localStorage.getItem('dashboard-theme') === 'dark' ? 'dark' : 'light'));

  useEffect(() => {
    const stored = localStorage.getItem('dashboard-theme');
    if (stored === 'dark' || stored === 'light') setTheme(stored as 'light' | 'dark');
    const listener = (e: StorageEvent) => {
      if (e.key === 'dashboard-theme' && (e.newValue === 'dark' || e.newValue === 'light')) {
        setTheme(e.newValue as 'light' | 'dark');
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);

  return <div className={theme === 'dark' ? 'dark-mode' : 'light-mode'}>{children}</div>;
}


