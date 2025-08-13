"use client";

import React from 'react';
import styles from './style/dashboard.module.scss';

export default function DashboardPage() {
  return (
    <div className={styles.dashboardPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Time management</h1>
          <p>Manage your projects and tasks efficiently</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addProjectBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            New Project
          </button>
        </div>
      </div>

      {/* Project Stats */}
      <div className={styles.projectStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>12</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>8</h3>
            <p>In Progress</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>5</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <h3>3</h3>
            <p>Projects</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className={styles.recentProjects}>
        <div className={styles.sectionHeader}>
          <h2>Recent Projects</h2>
          <button className={styles.viewAllBtn}>View All</button>
        </div>
        
        <div className={styles.projectGrid}>
          <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h3>Design System</h3>
              <span className={`${styles.projectStatus} ${styles.completed}`}>Completed</span>
            </div>
            <p className={styles.projectDescription}>
              Create a comprehensive design system for the new product line
            </p>
            <div className={styles.projectMeta}>
              <span className={styles.deadline}>Due: Dec 15, 2024</span>
              <span className={styles.progress}>100%</span>
            </div>
          </div>

          <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h3>User Flow</h3>
              <span className={`${styles.projectStatus} ${styles.inProgress}`}>In Progress</span>
            </div>
            <p className={styles.projectDescription}>
              Design and prototype user journey for the mobile app
            </p>
            <div className={styles.projectMeta}>
              <span className={styles.deadline}>Due: Jan 20, 2025</span>
              <span className={styles.progress}>65%</span>
            </div>
          </div>

          <div className={styles.projectCard}>
            <div className={styles.projectHeader}>
              <h3>UX Research</h3>
              <span className={`${styles.projectStatus} ${styles.pending}`}>Pending</span>
            </div>
            <p className={styles.projectDescription}>
              Conduct user research and usability testing
            </p>
            <div className={styles.projectMeta}>
              <span className={styles.deadline}>Due: Feb 10, 2025</span>
              <span className={styles.progress}>0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
            </svg>
            Create Task
          </button>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
            </svg>
            Schedule Meeting
          </button>
          <button className={styles.actionBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
            </svg>
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
