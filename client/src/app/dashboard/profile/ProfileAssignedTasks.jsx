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

/** Fallback demo data when the assigned-tasks API returns empty (remove once backend is wired). */
const MOCK_ASSIGNED_TASKS = [
  {
    id: 9001,
    title: 'Design new ui presentation',
    project: 'Dribbble marketing',
    status: 'in-progress',
    dueDate: '2022-08-24',
    progress: 7,
    totalSteps: 10,
    comments: Array(7).fill(null),
    attachments: Array(2).fill(null),
  },
  {
    id: 9002,
    title: 'Resolve conflicting merge',
    project: 'Internal project',
    status: 'todo',
    dueDate: '2022-08-24',
    progress: 3,
    totalSteps: 10,
    comments: Array(2).fill(null),
    attachments: Array(1).fill(null),
  },
  {
    id: 9003,
    title: 'Fixing responsive layout',
    project: 'Portfolio redesign',
    status: 'in-progress',
    dueDate: '2022-08-24',
    progress: 5,
    totalSteps: 10,
    comments: Array(4).fill(null),
    attachments: Array(2).fill(null),
  },
  {
    id: 9004,
    title: 'Update onboarding flow',
    project: 'Product launch',
    status: 'todo',
    dueDate: '2022-09-01',
    progress: 2,
    totalSteps: 10,
    comments: Array(1).fill(null),
    attachments: [],
  },
  {
    id: 9005,
    title: 'Review analytics dashboard',
    project: 'Growth team',
    status: 'in-progress',
    dueDate: '2022-09-05',
    progress: 6,
    totalSteps: 10,
    comments: Array(3).fill(null),
    attachments: Array(1).fill(null),
  },
  {
    id: 9101,
    title: 'Design new ui presentation',
    project: 'Dribbble marketing',
    status: 'done',
    dueDate: '2022-08-24',
    progress: 10,
    totalSteps: 10,
    comments: Array(7).fill(null),
    attachments: Array(2).fill(null),
  },
  {
    id: 9102,
    title: 'Resolve conflicting merge',
    project: 'Internal project',
    status: 'done',
    dueDate: '2022-08-24',
    progress: 10,
    totalSteps: 10,
    comments: Array(2).fill(null),
    attachments: Array(1).fill(null),
  },
  {
    id: 9103,
    title: 'Fixing responsive layout',
    project: 'Portfolio redesign',
    status: 'done',
    dueDate: '2022-08-24',
    progress: 10,
    totalSteps: 10,
    comments: Array(4).fill(null),
    attachments: Array(2).fill(null),
  },
  {
    id: 9104,
    title: 'Ship release notes',
    project: 'Product launch',
    status: 'done',
    dueDate: '2022-08-20',
    progress: 10,
    totalSteps: 10,
    comments: Array(5).fill(null),
    attachments: [],
  },
];

function mapServerStatus(status) {
  if (status === 'in_progress' || status === 'in-progress') return 'in-progress';
  if (status === 'completed' || status === 'done') return 'done';
  return status || 'todo';
}

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
  const { tasks: contextTasks } = useProjects();
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
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

  const fetchAssignedTasks = useCallback(async () => {
    if (!user?.id) {
      setAssignedTasks(MOCK_ASSIGNED_TASKS);
      setUsingMockData(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api(`${API_ENDPOINTS.TASKS.LIST}?userId=${user.id}`);
      const rawTasks = data?.tasks || data?.results || (Array.isArray(data) ? data : []);

      if (rawTasks.length > 0) {
        setAssignedTasks(rawTasks.map(normalizeAssignedTask));
        setUsingMockData(false);
        return;
      }

      const contextAssigned = contextTasks.filter((task) =>
        task.contributors?.some((name) =>
          [displayName, user.username, user.email].filter(Boolean).some(
            (value) => name.toLowerCase().includes(String(value).toLowerCase())
          )
        )
      );

      if (contextAssigned.length > 0) {
        setAssignedTasks(contextAssigned);
        setUsingMockData(false);
      } else {
        setAssignedTasks(MOCK_ASSIGNED_TASKS);
        setUsingMockData(true);
      }
    } catch {
      const contextAssigned = contextTasks.filter((task) => task.contributors?.length);
      setAssignedTasks(contextAssigned.length > 0 ? contextAssigned : MOCK_ASSIGNED_TASKS);
      setUsingMockData(contextAssigned.length === 0);
    } finally {
      setIsLoading(false);
    }
  }, [user, contextTasks, displayName]);

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

  return (
    <>
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

      {usingMockData && (
        <p className={styles.mockDataNotice} role="status">
          Showing sample tasks until assigned-task data is returned from the API.
        </p>
      )}

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

      <TaskDrawer
        taskId={selectedTaskId}
        isOpen={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
      />
    </>
  );
}
