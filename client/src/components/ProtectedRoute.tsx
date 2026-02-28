"use client";

import { useSession } from '../hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// -------------------- CONSTANTS --------------------

const SIGNIN_PATH = '/auth/signin';

// -------------------- TYPES --------------------

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// -------------------- COMPONENT --------------------

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = (
    <div role="status" aria-live="polite">
      Loading...
    </div>
  ),
}) => {
  const { isAuthenticated, isSessionValid, isLoading } = useSession();
  const router = useRouter();

  /**
   * Redirects to signin if not authenticated
   */
  useEffect(() => {
    if (!isLoading && (isSessionValid === false || !isAuthenticated)) {
      router.replace(SIGNIN_PATH);
    }
  }, [isAuthenticated, isSessionValid, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading || isSessionValid === null) {
    return <>{fallback}</>;
  }

  // Show loading state while redirecting
  if (!isAuthenticated || isSessionValid === false) {
    return (
      <div role="status" aria-live="polite">
        Redirecting to signin...
      </div>
    );
  }

  return <>{children}</>;
};
