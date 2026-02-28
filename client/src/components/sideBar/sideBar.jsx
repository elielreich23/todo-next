"use client";

import React from 'react';
import styles from './styles.module.scss';

/**
 * Placeholder sidebar for dashboard layout.
 * Replace with full nav when ready (see dashboard.jsx for reference nav structure).
 */
export default function SideBar() {
  return (
    <aside className={styles.sidebar} aria-label="Dashboard navigation">
      <div className={styles.placeholder}>Nav</div>
    </aside>
  );
}
