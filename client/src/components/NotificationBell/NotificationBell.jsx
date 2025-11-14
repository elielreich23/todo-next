"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { API_ENDPOINTS } from '../../constants';
import { formatDate } from '../../utils/formatters';
import styles from './NotificationBell.module.scss';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Fetch unread notifications count
  const fetchUnreadCount = async () => {
    try {
      const response = await api(API_ENDPOINTS.NOTIFICATIONS.UNREAD);
      if (response.success) {
        setUnreadCount(response.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch last 3 notifications for dropdown
  const fetchRecentNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api(API_ENDPOINTS.NOTIFICATIONS.LIST);
      if (response.success) {
        // Get last 3 notifications
        const recent = response.notifications.slice(0, 3);
        setNotifications(recent);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load unread count on mount and periodically
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch recent notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark notification as read and navigate
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notification.id), {
          method: 'PUT'
        });
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    setIsOpen(false);
    router.push(`/dashboard/notifications?id=${notification.id}`);
  };

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
    <div className={styles.notificationBell} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5,1.5v.68C7.63,5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="currentColor"/>
        </svg>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <h3>Notification</h3>
          </div>
          
          <div className={styles.notificationsList}>
            {isLoading ? (
              <div className={styles.loading}>Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className={styles.emptyState}>No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.avatar}>
                    <img 
                      src={`/api/placeholder/40/40?seed=${notification.id}`} 
                      alt={getUserDisplayName(notification)}
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
                </div>
              ))
            )}
          </div>

          <div className={styles.dropdownFooter}>
            <button
              className={styles.viewAllButton}
              onClick={() => {
                setIsOpen(false);
                router.push('/dashboard/notifications');
              }}
            >
              All Notification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

