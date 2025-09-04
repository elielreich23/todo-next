"use client";

import React from 'react';
import styles from '../style/statistics.module.scss';

export default function StatisticsPage() {
  return (
    <div className={styles.statisticsPage}>
      <div className={styles.header}>
        <h1>Statistics</h1>
        <p>View your task and project statistics</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Task Overview</h2>
          <p>Statistics content will go here...</p>
        </div>
      </div>
    </div>
  );
}
