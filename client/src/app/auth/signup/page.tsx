"use client";

import { useState } from 'react';
import axios from 'axios';
import styles from './styles.module.scss';
import "../../../styles/global.scss";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const USER_REGEX = /^[A-z][A-z0-9-_]{3,23}$/;
const PWD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/;

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

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
      // Simulate server delay — remove when backend is ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate successful signup redirect
      router.push("/dashboard");
    } catch (err) {
      setError("Failed to sign up");
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>Tasker</div>
        <h1 className={styles.welcomeMessage}>Welcome to Taskero</h1>
        <p>
          Already have an account?{' '}
          <Link href="../../auth/signin/" className={styles.createAccountLink}>
            Login here
          </Link>
        </p>
        <p className={styles.terms}>
          By clicking sign up or continue with Google, you agree to our{' '}
          <a href="#">Terms of use</a> and <a href="#">policy</a>.
        </p>
      </div>
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSignup}>
          <button type="button" className={styles.googleButton}>
            <img src="/google-icon.svg" alt="Google Icon" style={{ marginRight: '0.5rem' }} />
            Continue with Google
          </button>
          <input
            type="email"
            placeholder="Email Address"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validatePassword(e.target.value);
            }}
            required
            disabled={isLoading}
          />
          {passwordError && <p className={styles.error}>{passwordError}</p>}
          <input
            type="password"
            placeholder="Confirm Password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          {error && <p className={styles.error}>{error}</p>}
          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
