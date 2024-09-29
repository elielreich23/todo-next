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
  const router = useRouter(); 

  const handleSignin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/auth/signin', { // Update to match your backend URL and route
        email,
        password,
      });

      // Save the JWT token in localStorage
      localStorage.setItem('token', response.data.token);

      // Navigate to the dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
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
            <imgage src="/google-icon.svg" alt="Google Icon" style={{ marginRight: '0.5rem' }} />
            Continue with Google
          </button>
          <input
            type="email"
            placeholder="Email Address"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <a href="#" className={`${styles.link} ${styles.textWhite}`}>
            Forgot password? <span className={styles.link}>Click here</span>
          </a>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.loginButton}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
