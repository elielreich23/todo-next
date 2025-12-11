//work on user validation

"use client";

import { useState, useEffect } from 'react';
import styles from './styles.module.scss';
import "../../../styles/global.scss";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '../../../contexts/UserContext';
import PasswordStrengthMeter from '../../../components/PasswordStrengthMeter/PasswordStrengthMeter';
import GoogleSignIn from '../../../components/GoogleSignIn/GoogleSignIn';

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
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, isValid: false });
  const router = useRouter();
  const { remoteSignup, googleAuth, isAuthenticated, isLoading: userLoading, user } = useUser();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Apply auth page body styles while this page is mounted
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.add('auth-page');
      return () => {
        document.body.classList.remove('auth-page');
      };
    }
  }, []);

  // Redirect to dashboard if already authenticated and user is loaded
  useEffect(() => {
    if (!userLoading && isAuthenticated && user) {
      // Clear signing up state and redirect
      setIsSigningUp(false);
      router.push('../../dashboard');
    }
  }, [isAuthenticated, user, userLoading, router]);

  // Show loading if checking authentication, user is loading, or we just signed up
  if (userLoading || (isAuthenticated && user) || isSigningUp) {
    return (
      <div style={{
        textAlign: 'center',
        marginTop: '50px',
        fontSize: '1.5rem',
        color: '#666'
      }}>
        {isSigningUp ? 'Creating your account...' : 'Redirecting to dashboard...'}
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

    // Check password strength meets minimum requirement
    if (passwordStrength.score < 2) {
      setError("Password is too weak. Please choose a stronger password.");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      setIsSigningUp(true);
      console.log("Attempting to signup with:", { fullName, username, email });

      // Send signup request to our Django backend
      await remoteSignup({
        username: username.trim(),
        email: email.trim(),
        full_name: fullName.trim(),
        password: password,
        password_confirm: confirmPassword
      });

      setError("");
      console.log("Signup successful, user data cached, waiting for context to update...");

      // Wait for user context to finish loading and user to be available
      // The useEffect will handle the redirect once user is ready
      // We keep isSigningUp true so the loading screen shows
      // The useEffect will redirect when user and isAuthenticated are ready
    } catch (err: any) {
      console.error("Signup error:", err);
      setIsSigningUp(false);

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
            <GoogleSignIn
                onSuccess={async (credential: string) => {
                  setIsGoogleLoading(true);
                  setError('');
                  try {
                    setIsSigningUp(true);
                    await googleAuth(credential);
                    // UserContext and useEffect will handle redirect
                  } catch (err: any) {
                    setIsSigningUp(false);
                    console.error('Google signup error:', err);
                    if (err.response?.data?.message) {
                      setError(err.response.data.message);
                    } else if (err.message) {
                      setError(err.message);
                    } else {
                      setError('Google signup failed. Please try again.');
                    }
                  } finally {
                    setIsGoogleLoading(false);
                  }
                }}
                onError={(errorMessage: string) => {
                  setError(errorMessage);
                  setIsGoogleLoading(false);
                }}
                disabled={isLoading || isGoogleLoading || isSigningUp}
              />

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
              <PasswordStrengthMeter
                password={password}
                userInputs={[]}
                onStrengthChange={setPasswordStrength}
                showFeedback={true}
                minScore={2}
              />
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
