"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../contexts/UserContext';
import styles from './styles.module.css';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { remoteLogin, isAuthenticated } = useUser();

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
      
      // If we get here, login was successful
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      if (err.message.includes('Invalid email or password')) {
        setError(
          <span>
            Wrong password or invalid account. 
            <Link href="/auth/signup" className={styles.signupLink}>
              Create account
            </Link>
          </span>
        );
      } else if (err.message.includes('Account is deactivated')) {
        setError('This account has been deactivated. Please contact support.');
      } else if (err.message.includes('Network') || err.code === 'ERR_NETWORK') {
        setError("Network error: Cannot connect to server. Please check if the backend is running.");
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignin = () => {
    // Handle Google signin logic here
    console.log('Google signin attempt');
  };

  return (
    <div className={styles.container}>
      {/* Left Section - Welcome Message */}
      <div className={styles.left}>
        <div className={styles.logo}>taskers</div>
        
        <h1 className={styles.welcomeMessage}>Welcome back!</h1>
        
        <p className={styles.paragraph}>
          Don&apos;t have an account? 
          <Link href="/auth/signup" className={styles.createAccountLink}>
            Create Account
          </Link>
        </p>

        {/* Decorative circles */}
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
        <div className={styles.circle4}></div>

        {/* Terms and Policy */}
        <div className={styles.terms}>
          <p>By clicking sign in or continue with Google,</p>
          <p>You agree to our <Link href="/terms">Terms of use</Link> and <Link href="/policy">policy</Link></p>
        </div>
      </div>

      {/* Right Section - Signin Form */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Sign in</h2>
          <p className={styles.formSubtitle}>All in one platform to get tasks done</p>
          
          {/* Error Display */}
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <form className={styles.form} onSubmit={handleSubmit}>
            {/* Google Signin Button */}
            <button 
              type="button" 
              className={styles.googleButton}
              onClick={handleGoogleSignin}
            >
              <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Email Input */}
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

            {/* Password Input */}
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

            {/* Forgot Password Link */}
            <div className={styles.forgotPassword}>
              <span>Forgot password? </span>
              <Link href="/auth/forgetPwd" className={styles.forgotPasswordLink}>
                Click here
              </Link>
            </div>

            {/* Login Button */}
            <button 
              type="submit" 
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          
          {/* Helpful signup guidance */}
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
