  /* eslint-disable react/no-unescaped-entities */
  import "../../../styles/global.scss"
  import styles from './styles.module.scss';
  import Link from "next/link";
  import Image from "next/image";

  export default function Login() {
    return (
      <div className={styles.container}>
        <div className={styles.left}>
          <div className={styles.logo}>Tasker</div>
         <div className={styles.bubbles}></div>
          <h1 className={styles.welcomeMessage}>Welcome back!</h1>
          <p className={styles.paragraph}>
            Don't have an account?  
            <Link href="../../auth/signup/" className={styles.createAccountLink}>
            Create Account</Link>
          </p>
          <p className={styles.terms}>
            By clicking sign in or continue with Google, <br/> you agree to our <a href="#">Terms of use</a> and <a href="#">policy</a>.
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
            <a href="#" className={`${styles.link} ${styles.textWhite}`}>Forgot password? <span className={styles.link}>Click here</span></a>
            
            <button className={styles.loginButton}>Login</button>
          
          </div>
        </div>
      </div>
    );
  }
