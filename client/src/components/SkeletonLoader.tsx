/**
 * Skeleton Loader Components for async content
 * Provides loading placeholders that match the content structure
 */
'use client';

import React from 'react';
import styles from './SkeletonLoader.module.scss';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base skeleton component
 */
export function Skeleton({
  width,
  height,
  borderRadius,
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || '1em',
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : variant === 'text' ? '4px' : '8px'),
  };

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${styles[animation]} ${className}`}
      style={style}
      aria-label="Loading..."
    />
  );
}

/**
 * Skeleton for task cards
 */
export function TaskCardSkeleton() {
  return (
    <div className={styles.taskCardSkeleton}>
      <div className={styles.taskCardHeader}>
        <Skeleton width="60%" height="20px" variant="text" />
        <Skeleton width="30px" height="30px" variant="circular" />
      </div>
      <Skeleton width="100%" height="16px" variant="text" />
      <Skeleton width="80%" height="16px" variant="text" />
      <div className={styles.taskCardFooter}>
        <Skeleton width="80px" height="24px" variant="rectangular" />
        <Skeleton width="60px" height="24px" variant="rectangular" />
      </div>
    </div>
  );
}

/**
 * Skeleton for project list
 */
export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={styles.projectListSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.projectItemSkeleton}>
          <Skeleton width="40px" height="40px" variant="circular" />
          <div className={styles.projectItemContent}>
            <Skeleton width="60%" height="18px" variant="text" />
            <Skeleton width="40%" height="14px" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for user list
 */
export function UserListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.userListSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.userItemSkeleton}>
          <Skeleton width="32px" height="32px" variant="circular" />
          <div className={styles.userItemContent}>
            <Skeleton width="120px" height="16px" variant="text" />
            <Skeleton width="80px" height="14px" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for dashboard page
 */
export function DashboardSkeleton() {
  return (
    <div className={styles.dashboardSkeleton}>
      <div className={styles.dashboardHeader}>
        <Skeleton width="200px" height="32px" variant="text" />
        <Skeleton width="120px" height="40px" variant="rectangular" />
      </div>
      <div className={styles.dashboardColumns}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className={styles.columnSkeleton}>
            <Skeleton width="100%" height="40px" variant="rectangular" />
            <div className={styles.columnTasks}>
              {Array.from({ length: 2 }).map((_, taskIndex) => (
                <TaskCardSkeleton key={taskIndex} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for notification list
 */
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={styles.notificationListSkeleton}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.notificationItemSkeleton}>
          <Skeleton width="40px" height="40px" variant="circular" />
          <div className={styles.notificationContent}>
            <Skeleton width="70%" height="16px" variant="text" />
            <Skeleton width="50%" height="14px" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className={styles.tableRowSkeleton}>
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index}>
          <Skeleton width="80%" height="20px" variant="text" />
        </td>
      ))}
    </tr>
  );
}
