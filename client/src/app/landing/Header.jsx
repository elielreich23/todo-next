import React from 'react';
import Link from 'next/link';
import styles from './Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>taskers</div>
        
        <ul className={styles.navLinks}>
          <li><a href="#about">About</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#contact">Contact Us</a></li>
          <li><a href="#faqs">FAQs</a></li>
        </ul>
        
        <div className={styles.authLinks}>
          <Link href="/auth/signin" className={styles.login}>Login</Link>
          <Link href="/auth/signup" className={styles.signup}>Sign Up</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
