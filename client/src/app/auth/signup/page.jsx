"use client"; // Ensure this component is treated as a Client Component

import { useState } from 'react';
import axios from 'axios';
import styles from './styles.module.scss';
import "../../../styles/global.scss";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/auth/signup', {
        email,
        password,
      });

      // Save the token in localStorage or use it as needed
      localStorage.setItem('token', response.data.token);

      // Redirect to the dashboard or login page
      router.push('/dashboard');
    } catch (error) {
      alert('Signup failed');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>Tasker</div>
        <h1 className={styles.welcomeMessage}>Welcome to Taskero</h1>
        <p>
          Already have an account? 
          <Link href="../../auth/signin/" className={styles.createAccountLink}>Login here</Link>
        </p>
        <p className={styles.terms}>
          By clicking sign up or continue with Google, you agree to our <a href="#">Terms of use</a> and <a href="#">policy</a>.
        </p>
      </div>
      <div className={styles.right}>
        <form className={styles.form} onSubmit={handleSignup}>
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
          <input
            type="password"
            placeholder="Confirm Password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit" className={styles.loginButton}>
            Continue with email
          </button>
        </form>
      </div>
    </div>
  );
}
