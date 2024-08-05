import styles from './styles.module.scss';
import "../../../styles/global.scss"
import Link from 'next/link';

export default function Signup() {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>Taskero</div>
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
        <div className={styles.form}>
          <button className={styles.googleButton}>
            <imgage src="/google-icon.svg" alt="Google Icon" style={{ marginRight: '0.5rem' }} />
            Continue with Google
          </button>
          <input type="email" placeholder="Email Address" className={styles.input} />
          <input type="password" placeholder="Password" className={styles.input} />
          <input type="password" placeholder="Confirm Password" className={styles.input} />
          <button className={styles.loginButton}>Continue with email</button>
        </div>
      </div>
    </div>
  );
}

