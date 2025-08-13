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
            type="text"
            placeholder="Full Name"
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            disabled={isLoading}
          />
          
          <input
            type="text"
            placeholder="Username"
            className={styles.input}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              validateUsername(e.target.value);
            }}
            required
            disabled={isLoading}
          />
          {usernameError && <p className={styles.error}>{usernameError}</p>}
          
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
