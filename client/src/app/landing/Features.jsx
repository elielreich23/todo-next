import React from 'react';
import styles from './Features.module.scss';

const Features = () => {
  return (
    <section className={styles.features}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          Redefining Seamless Task Management
        </h2>
        <p className={styles.sectionDescription}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        
        <h3 className={styles.featuresTitle}>Key features</h3>
        
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <p className={styles.cardText}>
                ssist in getting tasks done.
              </p>
              <button className={styles.viewMore}>View more</button>
            </div>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <h4 className={styles.cardTitle}>Fast documentation</h4>
              <p className={styles.cardDescription}>
                Lorem ipsum dolor et laran in the frame, follow up on team and developmental tasks
              </p>
              <div className={styles.projectSection}>
                <h5 className={styles.projectTitle}>Mandem Project</h5>
                <p className={styles.projectDescription}>
                  Building a web3 mobile application project
                </p>
              </div>
              <div className={styles.teamSection}>
                <div className={styles.teamAvatars}>
                  <div className={styles.avatar}></div>
                  <div className={styles.avatar}></div>
                  <div className={styles.avatar}></div>
                  <div className={styles.avatar}></div>
                  <div className={styles.avatar}></div>
                </div>
                <p className={styles.newMessages}>+21 new message</p>
                <button className={styles.sendMessage}>
                  Send a message
                  <svg className={styles.arrow} width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.cardContent}>
              <h4 className={styles.cardTitle}>Lorem ipsum</h4>
              <p className={styles.cardDescription}>
                Our app have built-in AI features to
              </p>
              <div className={styles.aiFeatures}>
                <h5 className={styles.aiTitle}>AI features</h5>
                <ul className={styles.aiList}>
                  <li>
                    <span className={styles.aiIcon}>📧</span>
                    Schedule Email
                  </li>
                  <li>
                    <span className={styles.aiIcon}>💬</span>
                    Auto-Message
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.createTaskSection}>
          <button className={styles.createTask}>
            Create Task
            <svg className={styles.arrow} width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Features;
