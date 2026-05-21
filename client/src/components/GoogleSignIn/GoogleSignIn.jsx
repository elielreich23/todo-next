"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './GoogleSignIn.module.scss';

/**
 * Google Sign-In Button Component
 * Custom styled button that integrates with Google Identity Services
 *
 * @param {{
 *   onSuccess?: ((credential: string) => Promise<void> | void) | null,
 *   onError?: ((message: string) => void) | null,
 *   onClick?: (() => Promise<void> | void) | null,
 *   disabled?: boolean
 * }} props
 */
export default function GoogleSignIn({
  onSuccess = null,
  onError = null,
  onClick = null,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const usesCustomClick = typeof onClick === 'function';

  const handleCredentialResponse = useCallback(async (response) => {
    setIsLoading(true);
    try {
      if (onSuccess) {
        await onSuccess(response.credential);
      }
    } catch (error) {
      console.error('Error in Google Sign-In callback:', error);
      if (onError) {
        onError(error.message || 'Google Sign-In failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError, onSuccess]);

  useEffect(() => {
    if (usesCustomClick) {
      setIsInitialized(true);
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      return;
    }

    const loadGoogleScript = () => {
      if (window.google && window.google.accounts) {
        initializeGoogle();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        if (onError) {
          onError('Failed to load Google Sign-In. Please refresh the page.');
        }
      };
      document.body.appendChild(script);

      script.onload = () => {
        setTimeout(() => {
          if (window.google && window.google.accounts) {
            initializeGoogle();
          }
        }, 100);
      };
    };

    const initializeGoogle = () => {
      if (!window.google || !window.google.accounts || !GOOGLE_CLIENT_ID || !containerRef.current) {
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Clear container
        containerRef.current.innerHTML = '';

        // Render Google's button
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: '100%',
          locale: 'en',
        });

        // Apply custom styling to Google's button
        setTimeout(() => {
          const googleButton = containerRef.current?.querySelector('div[role="button"]');
          if (googleButton) {
            // Hide the default button visually but keep it functional
            googleButton.style.opacity = '0';
            googleButton.style.position = 'absolute';
            googleButton.style.width = '100%';
            googleButton.style.height = '100%';
            googleButton.style.zIndex = '10';
            googleButton.style.cursor = 'pointer';
          }
        }, 200);

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Google Sign-In:', error);
        if (onError) {
          onError('Failed to initialize Google Sign-In.');
        }
      }
    };

    loadGoogleScript();
  }, [GOOGLE_CLIENT_ID, handleCredentialResponse, onError, usesCustomClick]);

  const handleButtonClick = async () => {
    if (usesCustomClick) {
      setIsLoading(true);
      try {
        await onClick();
      } catch (error) {
        console.error('Google Sign-In click error:', error);
        if (onError) {
          onError(error.message || 'Google Sign-In failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const googleButton = containerRef.current?.querySelector('div[role="button"]');
    if (googleButton) {
      googleButton.click();
    }
  };

  const isReady = usesCustomClick || isInitialized;
  const isDisabled = disabled || isLoading || !isReady || (!usesCustomClick && !GOOGLE_CLIENT_ID);

  return (
    <div className={styles.wrapper}>
      <div
        ref={containerRef}
        className={styles.googleButtonContainer}
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '50px',
          marginBottom: '1rem'
        }}
      >
        {/* Custom styled overlay button */}
        <button
          type="button"
          className={`${styles.customButton} ${isDisabled ? styles.disabled : ''}`}
          disabled={isDisabled}
          aria-label="Continue with Google"
          onClick={handleButtonClick}
        >
          {isLoading ? (
            <>
              <div className={styles.spinner}></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>
      </div>

      {!usesCustomClick && !GOOGLE_CLIENT_ID && (
        <p className={styles.configWarning}>

        </p>
      )}
    </div>
  );
}
