"use client";

import React, { useRef, useState } from 'react';
import styles from '../WizardModal/wizardModal.module.scss';
import { FILE_UPLOAD } from '../../constants';
import { formatFileSize } from '../../utils/formatters';

export default function TaskFileUpload({
  attachments,
  onAttachmentsChange,
  title = 'File Attachments',
  description = 'Upload files up to 200MB. Drag and drop or click to select.',
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const addFiles = (files) => {
    const errors = [];

    files.forEach((file) => {
      if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        errors.push(`${file.name} exceeds the ${FILE_UPLOAD.MAX_SIZE_MB}MB limit.`);
        return;
      }

      const attachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        uploadedAt: new Date(),
      };

      onAttachmentsChange((prev) => [...prev, attachment]);
    });

    setUploadError(errors.length > 0 ? errors.join(' ') : '');
  };

  const handleFileUpload = (event) => {
    addFiles(Array.from(event.target.files));
    event.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (fileId) => {
    onAttachmentsChange((prev) => prev.filter((f) => f.id !== fileId));
    setUploadError('');
  };

  return (
    <div className={styles.fileUploadSection}>
      <h3>{title}</h3>
      <p className={styles.uploadInfo}>{description}</p>

      {uploadError && (
        <div className={styles.fileUploadError} role="alert">
          {uploadError}
        </div>
      )}

      <div
        className={`${styles.fileUploadArea} ${isDragOver ? styles.dragOver : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="*/*"
          onChange={handleFileUpload}
          className={styles.fileInput}
        />
        <label className={styles.fileUploadLabel}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor"/>
            <path d="M14 2v6h6" fill="currentColor"/>
          </svg>
          <span>Click to upload files or drag and drop</span>
          <span>Max size: {FILE_UPLOAD.MAX_SIZE_MB}MB per file</span>
        </label>
      </div>

      {attachments.length > 0 && (
        <div className={styles.uploadedFiles}>
          <h4>Selected Files ({attachments.length})</h4>
          {attachments.map((file) => (
            <div key={file.id} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileSize}>
                  {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                </div>
              </div>
              <button
                className={styles.removeFileBtn}
                onClick={() => removeFile(file.id)}
                type="button"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
