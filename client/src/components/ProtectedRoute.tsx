"use client";

import { useSession } from '../hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback = <div>Loading...</div> 
}) => {
  const { isAuthenticated, isSessionValid, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and session is invalid
    if (!isLoading && (isSessionValid === false || !isAuthenticated)) {
      router.replace('/auth/signin');
    }
  }, [isAuthenticated, isSessionValid, isLoading, router]);

  // Show loading while checking authentication or session validation
  if (isLoading || isSessionValid === null) {
    return <>{fallback}</>;
  }

  // Show loading while redirecting
  if (!isAuthenticated || isSessionValid === false) {
    return <div>Redirecting to signin...</div>;
  }

  return <>{children}</>;
};
