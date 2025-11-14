"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useUser } from '../../../contexts/UserContext';
import styles from '../style/statistics.module.scss';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Wait for user context to finish loading
    if (userLoading) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      // User is not authenticated, but don't redirect here - let ProtectedRoute handle it
      // or check if we have tokens
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/auth/signin');
        return;
      }
    }

    const loadStatistics = async () => {
      try {
        setLoading(true);
        const response = await api('/api/statistics/');
        if (response.success) {
          setStats(response.statistics);
        } else {
          setError('Failed to load statistics');
        }
      } catch (err) {
        console.error('Error loading statistics:', err);
        // Don't show error if we're being redirected to login
        const errorMessage = err?.message || String(err || '');
        if (errorMessage.includes('Not authenticated') || errorMessage.includes('Please log in')) {
          // Let the redirect happen, don't set error
          return;
        }
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [user, userLoading, router]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className={styles.statisticsPage}>
        <div className={styles.header}>
          <h1>Statistics</h1>
          <p>Loading your statistics...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className={styles.statisticsPage}>
        <div className={styles.header}>
          <h1>Statistics</h1>
          <p>{error || 'No statistics available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statisticsPage}>
      <div className={styles.header}>
        <h1>Statistics</h1>
        <p>View your task and project statistics</p>
      </div>
      
      <div className={styles.statsGrid}>
        {/* Task Overview Cards */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Task Overview</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Tasks</span>
              <span className={styles.statValue}>{stats.tasks.total}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Completed</span>
              <span className={`${styles.statValue} ${styles.statSuccess}`}>
                {stats.tasks.completed}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>In Progress</span>
              <span className={`${styles.statValue} ${styles.statWarning}`}>
                {stats.tasks.in_progress}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>To Do</span>
              <span className={`${styles.statValue} ${styles.statInfo}`}>
                {stats.tasks.todo}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Completion Rate</span>
              <span className={styles.statValue}>
                {stats.tasks.completion_rate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Priority Distribution</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>High Priority</span>
              <span className={`${styles.statValue} ${styles.statDanger}`}>
                {stats.priorities.high}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Medium Priority</span>
              <span className={`${styles.statValue} ${styles.statWarning}`}>
                {stats.priorities.medium}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Low Priority</span>
              <span className={`${styles.statValue} ${styles.statInfo}`}>
                {stats.priorities.low}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Recent Activity</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Completed (30 days)</span>
              <span className={styles.statValue}>{stats.tasks.recent_completed}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Created (30 days)</span>
              <span className={styles.statValue}>{stats.tasks.recent_created}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Overdue Tasks</span>
              <span className={`${styles.statValue} ${stats.tasks.overdue > 0 ? styles.statDanger : ''}`}>
                {stats.tasks.overdue}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Assigned to Me</span>
              <span className={styles.statValue}>{stats.tasks.assigned_to_me}</span>
            </div>
          </div>
        </div>

        {/* Project Statistics */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Project Statistics</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Projects</span>
              <span className={styles.statValue}>{stats.projects.total}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Projects with Tasks</span>
              <span className={styles.statValue}>{stats.projects.with_tasks}</span>
            </div>
          </div>
        </div>

        {/* Activity Statistics */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Activity</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Comments</span>
              <span className={styles.statValue}>{stats.activity.total_comments}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Total Attachments</span>
              <span className={styles.statValue}>{stats.activity.total_attachments}</span>
            </div>
          </div>
        </div>

        {/* Completion Rate Progress */}
        <div className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h2>Overall Progress</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.progressSection}>
              <div className={styles.progressLabel}>
                <span>Completion Rate</span>
                <span className={styles.progressPercent}>
                  {stats.tasks.completion_rate.toFixed(1)}%
                </span>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${stats.tasks.completion_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks by Project */}
      {stats.projects.tasks_by_project && stats.projects.tasks_by_project.length > 0 && (
        <div className={styles.statCard} style={{ marginTop: '2rem' }}>
          <div className={styles.statCardHeader}>
            <h2>Tasks by Project</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.projectList}>
              {stats.projects.tasks_by_project.map((project) => {
                const maxTasks = Math.max(...stats.projects.tasks_by_project.map(p => p.task_count), 1);
                const percentage = (project.task_count / maxTasks) * 100;
                return (
                  <div key={project.id} className={styles.projectItem}>
                    <div className={styles.projectName}>{project.name}</div>
                    <div className={styles.projectBar}>
                      <div 
                        className={styles.projectBarFill}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className={styles.projectCount}>{project.task_count} tasks</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Daily Completion Trend */}
      {stats.trends && stats.trends.daily_completions && (
        <div className={styles.statCard} style={{ marginTop: '2rem' }}>
          <div className={styles.statCardHeader}>
            <h2>Completion Trend (Last 7 Days)</h2>
          </div>
          <div className={styles.statCardContent}>
            <div className={styles.trendChart}>
              {stats.trends.daily_completions.map((day, index) => {
                const maxCount = Math.max(...stats.trends.daily_completions.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={index} className={styles.trendBar}>
                    <div 
                      className={styles.trendBarFill}
                      style={{ height: `${height}%` }}
                    />
                    <div className={styles.trendBarLabel}>
                      <span className={styles.trendDayName}>{dayName}</span>
                      <span className={styles.trendCount}>{day.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
