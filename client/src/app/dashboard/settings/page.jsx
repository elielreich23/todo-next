"use client";

import React from 'react';
import styles from '../style/settings.module.scss';

export default function SettingsPage() {
  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Account Settings</h2>
          <p>Settings content will go here...</p>
        </div>
      </div>
    </div>
  );
}
