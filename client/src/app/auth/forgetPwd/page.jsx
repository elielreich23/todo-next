import styles from "./styles.module.scss";
import "../../../styles/global.scss"
import Link from "next/link";



export default function ForgotPassword() {
  return (
    <div className={styles.container}>
      <div className={styles.logo}>tasker</div>
      <form className={styles.form}>
      <div className={styles.title}>
          Forgot Password
          <p className={styles.subtitle}>Reclaim your account easily</p>
        </div>
        <label htmlFor="email" className={styles.label}>Email Address</label>
        <input type="email" id="email" className={styles.input} placeholder="Email Address" />
        <button type="submit" className={styles.resetButton}>Reset Password</button>
      </form>
      <div className={styles.authButtons}>

         <Link href="../../auth/signin/"className={styles.login}>Login</Link>
        <Link href="../../auth/signup" className={styles.signup}>Sign Up</Link>
      </div>
    </div>
  );
}
