"use client";

import React from 'react';
import styles from './uploads.module.scss';

export default function UploadsPage() {
  return (
    <div className={styles.uploadsPage}>
      <div className={styles.header}>
        <h1>Uploads</h1>
        <p>Manage your file uploads and documents</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>File Management</h2>
          <p>Uploads content will go here...</p>
        </div>
      </div>
    </div>
  );
}
