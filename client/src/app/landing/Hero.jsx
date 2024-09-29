import styles from '../../styles/landing/hero.module.scss';

export default function Hero() {
  return (
    <section id="hero" className={styles.heroSection}>
      <div className={styles.heroContent}>
        <h1>Your Ultimate Task Management Solution</h1>
        <p>Organize tasks efficiently, achieve more, and reduce stress effectively.</p>
        <div className={styles.buttons}>
          <button className={styles.getStartedButton}>Get Started</button>
          <button className={styles.howItWorksButton}>How It Works</button>
        </div>
      </div>
    </section>
  );
}
