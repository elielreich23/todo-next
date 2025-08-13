"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './styles.module.scss';
import "../../../styles/global.scss";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../contexts/UserContext';

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const router = useRouter();
  const { login, isAuthenticated } = useUser();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('../../dashboard');
    }
  }, [isAuthenticated, router]);

  // Show loading if checking authentication
  if (isAuthenticated) {
    return (
      <div style={{ 
        textAlign: 'center', 
        marginTop: '50px', 
        fontSize: '1.5rem',
        color: '#666'
      }}>
        Redirecting to dashboard...
      </div>
    );
  }

  const validatePassword = (pwd: string) => {
    if (!PWD_REGEX.test(pwd)) {
      setPasswordError(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%)'
      );
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateUsername = (username: string) => {
    if (!USER_REGEX.test(username)) {
      setUsernameError(
        'Username must be 4-24 characters long, start with a letter, and can contain letters, numbers, hyphens, and underscores'
      );
      return false;
    }
    setUsernameError('');
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate all fields
    if (!fullName.trim()) {
      setError("Full name is required");
      setIsLoading(false);
      return;
    }

    if (!validateUsername(username)) {
      setIsLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting to signup with:", { fullName, username, email });
      
      // Send signup request to our backend
      const response = await axios.post('http://localhost:3001/auth/signup', {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password
      }, {
        timeout: 10000 // 10 second timeout
      });

      console.log("Signup response:", response.data);

      if (response.data.success) {
        // Signup successful - store user data in context
        const userData = {
          username: username.trim(),
          email: email.trim(),
          fullName: fullName.trim(),
          id: response.data.user.id
        };
        
        // Login user through context (this will persist to localStorage)
        login(userData);
        
        setError("");
        console.log("Signup successful, redirecting to dashboard...");
        
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        setError(response.data.message || "Failed to sign up");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.code === 'ERR_NETWORK') {
        setError("Network error: Cannot connect to server. Please check if the backend is running.");
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      {/* Left Section - Welcome Message */}
      <div className={styles.left}>
        <div className={styles.logo}>taskero</div>
        
        <h1 className={styles.welcomeMessage}>Sign Up</h1>
        
        <p className={styles.paragraph}>
          Already have an account? 
          <Link href="/auth/signin" className={styles.createAccountLink}>
            Login here
          </Link>
        </p>

        {/* Decorative circles */}
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
        <div className={styles.circle4}></div>

        {/* Terms and Policy */}
        <div className={styles.terms}>
          <p>By clicking sign Up or continue with Google,</p>
          <p>You agree to our <Link href="/terms">Terms of use</Link> and <Link href="/policy">policy</Link></p>
        </div>
      </div>

      {/* Right Section - Signup Form */}
      <div className={styles.right}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Create Your Account</h2>
          <p className={styles.formSubtitle}>All in one platform to get tasks done</p>
          
          <form className={styles.form} onSubmit={handleSignup}>
            {/* Google Signup Button */}
            <button 
              type="button" 
              className={styles.googleButton}
              disabled={isLoading}
            >
              <svg className={styles.googleIcon} width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Full Name Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={styles.input}
                placeholder="Full Name"
                required
                disabled={isLoading}
              />
            </div>

            {/* Username Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                className={styles.input}
                placeholder="Username"
                required
                disabled={isLoading}
              />
              {usernameError && <p className={styles.error}>{usernameError}</p>}
            </div>

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
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                className={styles.input}
                placeholder="Password"
                required
                disabled={isLoading}
              />
              {passwordError && <p className={styles.error}>{passwordError}</p>}
              <p className={styles.passwordHint}>
                Minimum of Six (6) Characters including Number, Alphabet & special character (eg 1, &, %)
              </p>
            </div>

            {/* Confirm Password Input */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Password"
                required
                disabled={isLoading}
              />
            </div>

            {/* Error Display */}
            {error && <p className={styles.error}>{error}</p>}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={styles.signupButton}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : (
                <>
                  Sign Up
                  <svg className={styles.arrowIcon} width="20" height="20" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
