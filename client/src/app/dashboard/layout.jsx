"use client";

import { Suspense, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUser } from '../../contexts/UserContext';
import SideBar from '../../components/sideBar/sideBar';
import { DashboardSkeleton } from '../../components/SkeletonLoader';

// Lazy load heavy components
const NotificationBell = dynamic(() => import('../../components/NotificationBell/NotificationBell'), {
  ssr: false,
  loading: () => <div style={{ width: '40px', height: '40px' }} />,
});

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, validateSession } = useUser();

  useEffect(() => {
    // Validate session on mount
    validateSession();

    // Redirect if not authenticated after loading
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/signin');
      }
    }
  }, [isAuthenticated, isLoading, validateSession, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <DashboardSkeleton />
      </div>
    );
  }

  // If not authenticated after loading, show nothing (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <SideBar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <Suspense fallback={<div style={{ width: '40px', height: '40px' }} />}>
            <NotificationBell />
          </Suspense>
        </header>
        <main style={{ flex: 1, padding: '2rem' }}>
          <Suspense fallback={<DashboardSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
