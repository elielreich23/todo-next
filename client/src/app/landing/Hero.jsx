import React from 'react';
import styles from './Hero.module.scss';

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div className={styles.heroText}>
          <h1 className={styles.headline}>
            Your Ultimate <span className={styles.highlight}>Task Management</span> Solution
          </h1>
          <p className={styles.subheadline}>
            Organize tasks efficiently, achieve more, and reduce stress efficiently
          </p>
          <div className={styles.ctaButtons}>
            <button className={styles.getStarted}>
              Get Started
              <svg className={styles.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className={styles.howItWorks}>
              How it Works
            </button>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.circles}>
            <div className={styles.circle}>
              <span>Lorem Ipsum</span>
            </div>
            <div className={styles.circle}>
              <span>Lorem Ipsum</span>
            </div>
            <div className={styles.circle}>
              <span>Lorem Ipsum</span>
            </div>
            <div className={styles.circle}>
              <span>Lorem Ipsum</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
