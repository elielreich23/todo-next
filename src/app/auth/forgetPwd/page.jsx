import styles from "./styles.module.scss";
import "../../../styles/global.scss"
import Link from "next/link";



export default function ForgotPassword() {
  return (
    <div className={styles.container}>
      <div className={styles.logo}>taskero</div>
      <form className={styles.form}>
        <h2 className={styles.title}>Forgot Password</h2>
        <p className={styles.subtitle}>Reclaim your account easily</p>
        <label htmlFor="email" className={styles.label}>Email Address</label>
        <input type="email" id="email" className={styles.input} placeholder="Email Address" />
        <button type="submit" className={styles.resetButton}>Reset Password</button>
      </form>
      <div className={styles.authButtons}>

        <a href="#" className={styles.login}>Login</a>
        <a href="#" className={styles.signup}>Sign Up</a>
      </div>
    </div>
  );
}
