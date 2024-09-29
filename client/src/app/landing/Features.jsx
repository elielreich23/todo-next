import styles from '../../styles/landing/features.module.scss';

export default function Features() {
    return (
      <section id="features" className={styles.featuresSection}>
        <h2>Redefining Seamless Task Management</h2>
        <p>Here's how we help you achieve more with less stress:</p>
        <div className={styles.featureItems}>
          <div className={styles.featureItem}>
            <h3>Feature 1</h3>
            <p>Manage your tasks effortlessly.</p>
          </div>
          <div className={styles.featureItem}>
            <h3>Feature 2</h3>
            <p>Stay organized and on track.</p>
          </div>
          <div className={styles.featureItem}>
            <h3>Feature 3</h3>
            <p>Reduce stress and improve productivity.</p>
          </div>
        </div>
      </section>
    );
  } 