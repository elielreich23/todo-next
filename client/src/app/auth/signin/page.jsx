"use client";

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../../../contexts/UserContext';
import GoogleSignIn from '../../../components/GoogleSignIn/GoogleSignIn';
import { signInWithGoogle } from '../../../lib/supabase';
import styles from './styles.module.css';

function SignInContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { remoteLogin, isAuthenticated } = useUser();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('reason') === 'account-exists') {
      setError('An account already exists for that Google email. Please sign in instead.');
    }
  }, [searchParams]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await remoteLogin({
        email: email.trim(),
        password: password
      });

      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || err.toString();

      if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
        setError(`Too many login attempts. ${errorMessage.includes('wait') ? errorMessage.split('Too many requests. ')[1] || 'Please wait a moment before trying again.' : 'Please wait a moment before trying again.'}`);
      } else if (errorMessage.includes('Invalid email or password')) {
        setError(
          <span>
            Wrong password or invalid account.
            <Link href="/auth/signup" className={styles.signupLink}>
              Create account
            </Link>
          </span>
        );
      } else if (errorMessage.includes('Account is deactivated')) {
        setError('This account has been deactivated. Please contact support.');
      } else if (errorMessage.includes('Network') || err.code === 'ERR_NETWORK') {
        setError("Network error: Cannot connect to server. Please check if the backend is running.");
      } else {
        setError(errorMessage || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const { error: supabaseError } = await signInWithGoogle({ flow: 'signin' });

      if (supabaseError) {
        throw supabaseError;
      }
    } catch (err) {
      console.error('Google signin error:', err);
      const errorMessage = err.message || err.toString();

      if (errorMessage.includes('Too many requests') || errorMessage.includes('rate limit')) {
        setError(`Too many authentication attempts. ${errorMessage.includes('wait') ? errorMessage.split('Too many requests. ')[1] || 'Please wait a moment before trying again.' : 'Please wait a moment before trying again.'}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>taskers</div>

        <h1 className={styles.welcomeMessage}>Welcome back!</h1>

        <p className={styles.paragraph}>
          Don&apos;t have an account?
          <Link href="/auth/signup" className={styles.createAccountLink}>
            Create Account
          </Link>
        </p>

        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
        <div className={styles.circle4}></div>

        <div className={styles.terms}>
          <p>By clicking sign in or continue with Google,</p>
          <p>You agree to our <Link href="/terms">Terms of use</Link> and <Link href="/policy">policy</Link></p>
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign in</h2>
          <p className={styles.formSubtitle}>All in one platform to get tasks done</p>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSubmit}>
            <GoogleSignIn
                onClick={handleGoogleSignIn}
                onError={(errorMessage) => {
                  setError(errorMessage);
                  setIsGoogleLoading(false);
                }}
                disabled={isLoading || isGoogleLoading}
              />

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Email Address"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Password"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.forgotPassword}>
              <span>Forgot password? </span>
              <Link href="/auth/forgetPwd" className={styles.forgotPasswordLink}>
                Click here
              </Link>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <div className={styles.signupGuidance}>
            <p>
              New to Taskers?
              <Link href="/auth/signup" className={styles.signupGuidanceLink}>
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className={styles.container} aria-busy="true" />}>
      <SignInContent />
    </Suspense>
  );
}
