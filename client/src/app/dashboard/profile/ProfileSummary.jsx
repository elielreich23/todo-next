"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../../lib/api';
import { API_ENDPOINTS } from '../../../constants';
import styles from './profile.module.scss';

export default function ProfileSummary({ user }) {
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async () => {
    if (!user?.id) {
      setStatistics(null);
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api(API_ENDPOINTS.PROJECTS.STATISTICS);
      if (response?.success && response?.statistics) {
        setStatistics(response.statistics);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(err?.message || 'Failed to load statistics');
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return (
      <div className={styles.profileForm}>
        <h3>Your Summary</h3>
        <div className={styles.summaryLoading} aria-busy="true">
          Loading your statistics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.profileForm}>
        <h3>Your Summary</h3>
        <div className={styles.summaryError} role="alert">
          <p>{error}</p>
          <button
            type="button"
            className={styles.retryButton}
            onClick={fetchStatistics}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className={styles.profileForm}>
        <h3>Your Summary</h3>
        <div className={styles.emptySummary}>
          <p>No statistics available yet. Start creating tasks and projects to see your activity summary.</p>
        </div>
      </div>
    );
  }

  const { tasks, projects, activity, trends } = statistics;

  return (
    <div className={styles.profileForm}>
      <h3>Your Summary</h3>
      <p>Your activity statistics and achievements.</p>

      <div className={styles.summaryContent}>
        {/* Task Statistics */}
        <div className={styles.summaryCard}>
          <h4>Tasks Completed</h4>
          <p className={styles.summaryNumber}>{tasks?.completed || 0}</p>
          <p className={styles.summarySubtext}>of {tasks?.total || 0} total</p>
        </div>

        <div className={styles.summaryCard}>
          <h4>Projects Active</h4>
          <p className={styles.summaryNumber}>{projects?.total || 0}</p>
          <p className={styles.summarySubtext}>{projects?.with_tasks || 0} with tasks</p>
        </div>

        <div className={styles.summaryCard}>
          <h4>This Month</h4>
          <p className={styles.summaryNumber}>{tasks?.recent_completed || 0}</p>
          <p className={styles.summarySubtext}>tasks completed</p>
        </div>

        <div className={styles.summaryCard}>
          <h4>Completion Rate</h4>
          <p className={styles.summaryNumber}>{tasks?.completion_rate || 0}%</p>
          <p className={styles.summarySubtext}>overall rate</p>
        </div>

        {/* Activity Statistics */}
        <div className={styles.summaryCard}>
          <h4>Comments</h4>
          <p className={styles.summaryNumber}>{activity?.total_comments || 0}</p>
          <p className={styles.summarySubtext}>total comments</p>
        </div>

        <div className={styles.summaryCard}>
          <h4>Attachments</h4>
          <p className={styles.summaryNumber}>{activity?.total_attachments || 0}</p>
          <p className={styles.summarySubtext}>files uploaded</p>
        </div>

        {/* Priority Statistics */}
        <div className={styles.summaryCard}>
          <h4>High Priority</h4>
          <p className={styles.summaryNumber}>{tasks?.priorities?.high || 0}</p>
          <p className={styles.summarySubtext}>urgent tasks</p>
        </div>

        <div className={styles.summaryCard}>
          <h4>Overdue</h4>
          <p className={styles.summaryNumber}>{tasks?.overdue || 0}</p>
          <p className={styles.summarySubtext}>tasks overdue</p>
        </div>
      </div>

      {/* Daily Completion Trend */}
      {trends?.daily_completions && trends.daily_completions.length > 0 && (
        <div className={styles.trendsSection}>
          <h4>7-Day Completion Trend</h4>
          <div className={styles.trendChart}>
            {trends.daily_completions.map((day, index) => (
              <div key={index} className={styles.trendBar}>
                <div
                  className={styles.trendBarFill}
                  style={{
                    height: `${Math.max((day.count / Math.max(...trends.daily_completions.map(d => d.count))) * 100, 5)}%`
                  }}
                />
                <span className={styles.trendLabel}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={styles.trendCount}>{day.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
