"use client";

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useUser } from '../../contexts/UserContext';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

// Lazy load the Dashboard component
const Dashboard = dynamic(() => import('./dashboard'), {
  loading: () => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Loading dashboard...
    </div>
  ),
  ssr: false, // Disable SSR for dashboard if needed
});

export default function DashboardLayout({ children }) {
  const { isAuthenticated, isLoading, validateSession } = useUser();
  const router = useRouter();

  // Enable session timeout checking
  useSessionTimeout();

  useEffect(() => {
    // Check authentication when component mounts
    const checkAuth = async () => {
      if (!isLoading) {
        if (!isAuthenticated) {
          // Try to validate session
          const isValid = await validateSession();
          if (!isValid) {
            // No valid session, redirect to login
            router.push('/auth/signin');
            return;
          }
        }
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoading, validateSession, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated after loading, show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    }>
      <Dashboard>
        {children}
      </Dashboard>
    </Suspense>
  );
}
