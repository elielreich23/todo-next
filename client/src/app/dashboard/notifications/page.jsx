"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../constants';
import { formatDate } from '../../../utils/formatters';
import styles from './notifications.module.scss';

function NotificationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('id');
  
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch all notifications
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api(API_ENDPOINTS.NOTIFICATIONS.LIST);
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unread_count || 0);
        
        // If there's a selected ID, find and show that notification
        if (selectedId) {
          const notification = response.notifications.find(n => n.id === parseInt(selectedId));
          if (notification) {
            setSelectedNotification(notification);
            // Mark as read if not already read
            if (!notification.is_read) {
              markAsRead(notification.id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await api(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
        method: 'PUT'
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (selectedNotification?.id === id) {
        setSelectedNotification(prev => prev ? { ...prev, is_read: true } : null);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PUT'
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      if (selectedNotification) {
        setSelectedNotification(prev => prev ? { ...prev, is_read: true } : null);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    // Update URL without page reload
    router.push(`/dashboard/notifications?id=${notification.id}`, { scroll: false });
  };

  useEffect(() => {
    fetchNotifications();
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get user display name from notification
  const getUserDisplayName = (notification) => {
    const message = notification.message || '';
    // Extract name before "has" (e.g., "John Doe has assigned...")
    const match = message.match(/^([^ ]+ [^ ]+)\s+has/);
    if (match) return match[1];
    // Fallback: extract first two words
    const fallback = message.match(/^([^ ]+ [^ ]+)/);
    return fallback ? fallback[1] : 'User';
  };

  // Get action text from notification
  const getActionText = (notification) => {
    const message = notification.message || '';
    // Extract task ID from message (ID: 123) or use task field
    const idMatch = message.match(/ID:\s*(\d+)/);
    let taskId = idMatch ? idMatch[1] : (notification.task ? String(notification.task) : '');
    
    // If taskId is a number, use it; otherwise try to extract from task object
    if (!taskId && notification.task && typeof notification.task === 'object') {
      taskId = String(notification.task.id || '');
    }
    
    // Determine action based on notification type
    let action = 'Place an order';
    if (notification.notification_type === 'task_assigned') {
      action = 'Place an order';
    } else if (notification.notification_type === 'task_updated') {
      action = 'Update an order';
    } else if (notification.notification_type === 'task_completed') {
      action = 'Complete an order';
    }
    
    return taskId ? `${action} #${taskId}` : action;
  };

  // Format time ago
  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return formatDate(date);
  };

  return (
    <div className={styles.notificationsPage}>
      <div className={styles.header}>
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button className={styles.markAllReadButton} onClick={markAllAsRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.notificationsList}>
          {isLoading ? (
            <div className={styles.loading}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68C7.63,5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor" opacity="0.3"/>
              </svg>
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${
                  selectedNotification?.id === notification.id ? styles.selected : ''
                } ${!notification.is_read ? styles.unread : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className={styles.avatar}>
                  <Image 
                    src={`/api/placeholder/40/40?seed=${notification.id}`} 
                    alt={getUserDisplayName(notification)}
                    width={40}
                    height={40}
                  />
                </div>
                <div className={styles.notificationContent}>
                  <div className={styles.notificationText}>
                    <span className={styles.userName}>{getUserDisplayName(notification)}</span>
                    {' '}
                    <span className={styles.action}>{getActionText(notification)}</span>
                  </div>
                  <div className={styles.notificationTime}>
                    {getTimeAgo(notification.created_at)}
                  </div>
                </div>
                {!notification.is_read && (
                  <div className={styles.unreadIndicator}></div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedNotification && (
          <div className={styles.notificationDetail}>
            <div className={styles.detailHeader}>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setSelectedNotification(null);
                  router.push('/dashboard/notifications', { scroll: false });
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.detailContent}>
              <div className={styles.detailAvatar}>
                <Image 
                  src={`/api/placeholder/80/80?seed=${selectedNotification.id}`} 
                  alt={getUserDisplayName(selectedNotification)}
                  width={80}
                  height={80}
                />
              </div>
              
              <h2 className={styles.detailTitle}>{selectedNotification.title}</h2>
              
              <div className={styles.detailMessage}>
                <p>{selectedNotification.message}</p>
              </div>

              {selectedNotification.task_title && (
                <div className={styles.detailTask}>
                  <span className={styles.taskLabel}>Task:</span>
                  <span className={styles.taskName}>{selectedNotification.task_title}</span>
                </div>
              )}

              {selectedNotification.project_name && (
                <div className={styles.detailProject}>
                  <span className={styles.projectLabel}>Project:</span>
                  <span className={styles.projectName}>{selectedNotification.project_name}</span>
                </div>
              )}

              <div className={styles.detailTime}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.21z" fill="currentColor"/>
                </svg>
                {getTimeAgo(selectedNotification.created_at)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className={styles.notificationsPage}>
        <div className={styles.header}>
          <h1>Notifications</h1>
        </div>
        <div className={styles.content}>
          <div className={styles.loading}>Loading notifications...</div>
        </div>
      </div>
    }>
      <NotificationsContent />
    </Suspense>
  );
}

