import React from 'react';
import styles from './header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>TaskPro</div>
        <ul className={styles.navLinks}>
          <li><a href="#about">About</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#contact">Contact Us</a></li>
          <li><a href="#faqs">FAQs</a></li>
        </ul>
        <div className={styles.authLinks}>
          <button className={styles.login}>Login</button>
          <button className={styles.signup}>Sign Up</button>
        </div>
      </nav>

      <div className={styles.cta}>
        <h1>Your Ultimate Task Management Solution</h1>
        <p>Organize tasks efficiently, achieve more, and meet deadlines effortlessly.</p>
        <button className={styles.getStarted}>Get Started</button>
      </div>
    </header>
  );
};

export default Header;
