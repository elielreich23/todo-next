import styles from '../forgetPWd/styles.module.scss';
import "../../../styles/global.scss"


const ForgotPassword = () => {
  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <div className={styles.logo}>taskero</div>
      </div>
      <div className={styles.right}>
        <form className={styles.form}>
          <h2 className={styles.title}>Forgot Password</h2>
          <p className={styles.subtitle}>Reclaim your account easily</p>
          <label htmlFor="email" className={styles.label}>Email Address</label>
          <input type="email" id="email" className={styles.input} placeholder="Email Address" />
          <button type="submit" className={styles.resetButton}>Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
