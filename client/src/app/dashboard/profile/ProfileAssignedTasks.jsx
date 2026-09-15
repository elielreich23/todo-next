"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { TaskCard } from '../../../components/todo';
import { useProjects } from '../../../contexts/ProjectsContext';
import { api } from '../../../lib/api';
import { API_ENDPOINTS, DEFAULTS } from '../../../constants';
import { getUserDisplayName } from '../../../utils/formatters';
import styles from './profile.module.scss';

const TaskDrawer = dynamic(
  () => import('../../../components/todo').then((mod) => ({ default: mod.TaskDrawer })),
  { ssr: false }
);

const PREVIEW_COUNT = 3;

function mapServerStatus(status) {
  if (status === 'in_progress' || status === 'in-progress') return 'in-progress';
  if (status === 'completed' || status === 'done') return 'done';
  return status || 'todo';
}

// Normalize API, context, and mock tasks into the TaskCard contract used by the dashboard.
function normalizeAssignedTask(task) {
  const commentCount = task.comment_count ?? task.comments?.length ?? 0;
  const attachmentCount = task.attachment_count ?? task.attachments?.length ?? 0;

  return {
    id: task.id,
    title: task.title,
    project: task.project_name || task.project || 'General',
    status: mapServerStatus(task.status),
    dueDate: task.due_date || task.dueDate,
    progress: task.progress ?? 0,
    totalSteps: task.totalSteps || task.total_steps || 10,
    comments: task.comments ?? Array(commentCount).fill(null),
    attachments: task.attachments ?? Array(attachmentCount).fill(null),
  };
}

function TaskSection({
  title,
  accentClass,
  tasks,
  showAll,
  onToggleShowAll,
  progressTone,
  openDropdown,
  onDropdownToggle,
  onOpenTask,
}) {
  // Each assigned-task section previews a few cards and expands without refetching data.
  const visibleTasks = showAll ? tasks : tasks.slice(0, PREVIEW_COUNT);

  return (
    <section className={styles.taskSection}>
      <div className={styles.taskSectionHeader}>
        <div className={styles.taskSectionTitleRow}>
          <span className={`${styles.taskSectionAccent} ${accentClass}`} aria-hidden="true" />
          <h3 className={styles.taskSectionTitle}>{title}</h3>
          <span className={styles.taskSectionCount}>{tasks.length}</span>
        </div>
        <button type="button" className={styles.taskSectionAdd} aria-label={`Add ${title.toLowerCase()}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {visibleTasks.length === 0 ? (
        <div className={styles.emptyTasks}>
          <p>No {title.toLowerCase()} yet.</p>
        </div>
      ) : (
        <div className={styles.assignedTasksGrid}>
          {visibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              className={styles.assignedTaskCard}
              showStatus={false}
              progressTone={progressTone}
              openDropdown={openDropdown === task.id}
              onDropdownToggle={onDropdownToggle}
              onOpen={onOpenTask}
              onEdit={onOpenTask}
              onViewDetails={onOpenTask}
            />
          ))}
        </div>
      )}

      {tasks.length > PREVIEW_COUNT && (
        <button type="button" className={styles.showAllButton} onClick={onToggleShowAll}>
          {showAll ? 'Show less' : 'Show All'}
        </button>
      )}
    </section>
  );
}

export default function ProfileAssignedTasks({ profileData, user, userLoading }) {
  // Assigned-task state uses the official API with proper error handling.
  const { tasks: contextTasks } = useProjects();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showAllOngoing, setShowAllOngoing] = useState(false);
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const displayName = getUserDisplayName(
    profileData.firstName,
    profileData.lastName,
    profileData.username || user?.username,
    profileData.email || user?.email,
    DEFAULTS.USER_DISPLAY_NAME
  );

  const roleLabel = profileData.role ? ` (${profileData.role})` : '';
  const locationLabel = profileData.location || DEFAULTS.NOT_SET;

  // Fetch assigned tasks using the official API endpoint
  const fetchAssignedTasks = useCallback(async () => {
    if (!user?.id) {
      setAssignedTasks([]);
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api(`${API_ENDPOINTS.TASKS.LIST}?assignedToMe=1`);
      const rawTasks = data?.tasks || data?.results || (Array.isArray(data) ? data : []);

      setAssignedTasks(rawTasks.map(normalizeAssignedTask));
    } catch (err) {
      console.error('Failed to fetch assigned tasks:', err);
      setError(err?.message || 'Failed to load assigned tasks');
      setAssignedTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load assigned tasks once user identity is known.
  useEffect(() => {
    if (userLoading) return;
    fetchAssignedTasks();
  }, [userLoading, fetchAssignedTasks]);

  const ongoingTasks = useMemo(
    () => assignedTasks.filter((task) => task.status !== 'done'),
    [assignedTasks]
  );

  const completedTasks = useMemo(
    () => assignedTasks.filter((task) => task.status === 'done'),
    [assignedTasks]
  );

  const handleDropdownToggle = (taskId) => {
    setOpenDropdown((current) => (current === taskId ? null : taskId));
  };

  const handleOpenTask = (taskId) => {
    setOpenDropdown(null);
    if (contextTasks.some((task) => task.id === taskId)) {
      setSelectedTaskId(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.assignedTasksLoading} aria-busy="true">
        Loading assigned tasks...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.assignedTasksError} role="alert">
        <p>{error}</p>
        <button
          type="button"
          className={styles.retryButton}
          onClick={fetchAssignedTasks}
        >
          Retry
        </button>
      </div>
    );
  }

  if (assignedTasks.length === 0) {
    return (
      <div className={styles.emptyTasks}>
        <p>No assigned tasks yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Assignee header anchors the workload view to the active profile. */}
      <div className={styles.assignedProfileHeader}>
        <div className={styles.assignedProfileAvatar}>
          <Image
            src="/api/placeholder/120/120"
            alt={displayName}
            width={72}
            height={72}
          />
        </div>
        <div className={styles.assignedProfileDetails}>
          <h2 className={styles.assignedProfileName}>
            {displayName}
            {roleLabel && <span className={styles.assignedProfileRole}>{roleLabel}</span>}
          </h2>
          <p className={styles.assignedProfileLocation}>{locationLabel}</p>
        </div>
      </div>

      {/* Ongoing and completed lists share the same task-section layout with different tones. */}
      <TaskSection
        title="Ongoing Tasks"
        accentClass={styles.taskSectionAccentOngoing}
        tasks={ongoingTasks}
        showAll={showAllOngoing}
        onToggleShowAll={() => setShowAllOngoing((value) => !value)}
        progressTone="ongoing"
        openDropdown={openDropdown}
        onDropdownToggle={handleDropdownToggle}
        onOpenTask={handleOpenTask}
      />

      <TaskSection
        title="Completed Tasks"
        accentClass={styles.taskSectionAccentCompleted}
        tasks={completedTasks}
        showAll={showAllCompleted}
        onToggleShowAll={() => setShowAllCompleted((value) => !value)}
        progressTone="completed"
        openDropdown={openDropdown}
        onDropdownToggle={handleDropdownToggle}
        onOpenTask={handleOpenTask}
      />

      {/* Existing dashboard tasks can open in the shared detail drawer from this profile view. */}
      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}
