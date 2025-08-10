/* eslint-disable react/no-unescaped-entities */
"use client"; // Ensure this component is treated as a Client Component

import { useState } from 'react';
import axios from 'axios';
import styles from './styles.module.scss';
import "../../../styles/global.scss";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/auth/signin', {
        email: email.toLowerCase(),
        password,
      });

      if (response.data.success) {
        // Store the token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set default authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        
        // Navigate to the dashboard
        router.push('/dashboard');
      } else {
        setError(response.data.message || 'Authentication failed');
      }
    } catch (err) {
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(err.response.data.message || 'Authentication failed');
      } else if (err.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again later.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>Tasker</div>
        <div className={styles.bubbles}></div>
        <h1 className={styles.welcomeMessage}>Welcome back!</h1>
        <p className={styles.paragraph}>
          Don't have an account?  
          <Link href="../../auth/signup/" className={styles.createAccountLink}>
            Create Account
          </Link>
        </p>
        <p className={styles.terms}>
          By clicking sign in or continue with Google, <br/> you agree to our <a href="#">Terms of use</a> and <a href="#">policy</a>.
        </p>
      </div>
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSignin}>
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
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <a href="#" className={`${styles.link} ${styles.textWhite}`}>
            Forgot password? <span className={styles.link}>Click here</span>
          </a>

          {error && <p className={styles.error}>{error}</p>}

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
