"use client";

import React from 'react';
import styles from '../style/calendar.module.scss';

export default function CalendarPage() {
  return (
    <div className={styles.calendarPage}>
      <div className={styles.header}>
        <h1>Calendar</h1>
        <p>Manage your schedule and appointments</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Calendar View</h2>
          <p>Calendar content will go here...</p>
        </div>
      </div>
    </div>
  );
}
