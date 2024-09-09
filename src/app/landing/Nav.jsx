import Link from 'next/link';
import styles from '../../styles/landing/nav.module.scss';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>Tasker</div>
      <ul className={styles.navLinks}>
        <li><a href="#hero">Home</a></li>
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#contact">Contact Us</a></li>
      </ul>
      <div className={styles.authButtons}>
        <Link href="/auth/login"><button className={styles.loginButton}>Login</button></Link>
        <Link href="/auth/signup"><button className={styles.signupButton}>Sign Up</button></Link>
      </div>
    </nav>
  );
}
