"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../contexts/UserContext';
import { clearAuthTokens } from '../utils/storage';
import { CUSTOM_EVENTS } from '../constants';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Hook to handle session timeout after 15 minutes of inactivity
 */
export const useSessionTimeout = () => {
  const { user, logout, isAuthenticated } = useUser();
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear any existing timeout if user is not authenticated
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    // Function to reset the timeout
    const resetTimeout = () => {
      lastActivityRef.current = Date.now();

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        // Session expired due to inactivity
        console.log('Session expired due to inactivity');
        logout();
        router.push('/auth/signin');
      }, SESSION_TIMEOUT_MS);
    };

    // Activity event handlers
    const handleActivity = () => {
      resetTimeout();
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial timeout setup
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isAuthenticated, user, logout, router]);
};
