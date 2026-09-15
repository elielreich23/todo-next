"use client";

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { api } from '../../lib/api';
import { API_ENDPOINTS, FILE_UPLOAD } from '../../constants';
import styles from './AvatarUpload.module.scss';

export default function AvatarUpload({ currentAvatar, onAvatarChange, isLoading: externalLoading }) {
  const [preview, setPreview] = useState(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
      setError(`File size exceeds ${FILE_UPLOAD.MAX_SIZE_MB}MB limit`);
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setError(null);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadAvatar(file);
  }, []);

  const uploadAvatar = async (file) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api(API_ENDPOINTS.AUTH.PROFILE_UPDATE, {
        method: 'PUT',
        body: formData,
      });

      if (response?.success && response?.user) {
        onAvatarChange(response.user);
      } else {
        throw new Error(response?.message || 'Failed to upload avatar');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(err?.message || 'Failed to upload avatar');
      // Revert preview on error
      setPreview(currentAvatar);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setError(null);

    try {
      const response = await api(API_ENDPOINTS.AUTH.PROFILE_UPDATE, {
        method: 'PUT',
        body: JSON.stringify({ avatar: null }),
      });

      if (response?.success && response?.user) {
        setPreview(null);
        onAvatarChange(response.user);
      } else {
        throw new Error(response?.message || 'Failed to remove avatar');
      }
    } catch (err) {
      console.error('Avatar removal error:', err);
      setError(err?.message || 'Failed to remove avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayAvatar = preview || '/api/placeholder/120/120';

  return (
    <div className={styles.avatarUpload}>
      <div className={styles.avatarPreview} onClick={handleClick}>
        <div className={styles.avatarImage}>
          <Image
            src={displayAvatar}
            alt="Profile avatar"
            width={120}
            height={120}
            className={styles.avatarImg}
          />
          {(isUploading || externalLoading) && (
            <div className={styles.avatarOverlay}>
              <div className={styles.spinner} />
            </div>
          )}
        </div>
        <div className={styles.avatarBadge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className={styles.fileInput}
        aria-label="Upload avatar"
      />

      <div className={styles.avatarActions}>
        <button
          type="button"
          className={styles.uploadButton}
          onClick={handleClick}
          disabled={isUploading || externalLoading}
        >
          {isUploading ? 'Uploading...' : 'Change Avatar'}
        </button>
        {preview && (
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemoveAvatar}
            disabled={isUploading || externalLoading}
          >
            Remove
          </button>
        )}
      </div>

      {error && (
        <p className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <p className={styles.helpText}>
        Accepted formats: JPEG, PNG, GIF, WebP. Max size: {FILE_UPLOAD.MAX_SIZE_MB}MB
      </p>
    </div>
  );
}
