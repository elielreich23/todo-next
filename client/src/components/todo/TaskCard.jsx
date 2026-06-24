"use client";

import React, { memo } from 'react';
import styles from './TaskCard.module.css';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getDueDateState(dueDate, status) {
  if (!dueDate || status === 'done') return 'normal';
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  if (diffDays <= 3) return 'soon';
  return 'normal';
}

function formatDueDate(dateString, state) {
  const formatted = new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  if (state === 'overdue') return `Overdue · ${formatted}`;
  if (state === 'today') return 'Due today';
  if (state === 'soon') return `Due ${formatted}`;
  return formatted;
}

function statusClass(status) {
  if (status === 'in-progress') return styles.statusInProgress;
  if (status === 'done') return styles.statusDone;
  return styles.statusTodo;
}

function priorityClass(priority) {
  if (priority === 'high') return styles.priorityHigh;
  if (priority === 'low') return styles.priorityLow;
  return styles.priorityMedium;
}

const TaskCard = memo(function TaskCard({
  task,
  onOpen,
  onEdit,
  onViewDetails,
  onDelete,
  onMoveToProject,
  projects = [],
  showStatus = true,
  showDropdown = true,
  openDropdown = false,
  onDropdownToggle,
  progressTone = 'default',
  draggable = false,
  onDragStart,
  onDragEnd,
  isPending = false,
  pendingOperation,
  className = '',
}) {
  const dueState = getDueDateState(task.dueDate, task.status);
  const contributors = task.contributors || [];
  const visibleContributors = contributors.slice(0, 3);
  const overflowCount = contributors.length - 3;

  const handleCardClick = (e) => {
    if (e.target.closest('[data-interactive]')) return;
    onOpen?.(task.id);
  };

  return (
    <div
      className={`${styles.taskCard} ${isPending ? styles.pending : ''} ${className}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      style={{ cursor: onOpen || onEdit ? 'pointer' : 'default' }}
      data-task-id={task.id}
      data-task-status={task.status}
    >
      {isPending && (
        <div className={styles.pendingOverlay} aria-hidden="true">
          <span className={styles.spinner} />
          <span className={styles.pendingLabel}>
            {pendingOperation === 'deleting'
              ? 'Deleting...'
              : pendingOperation === 'moving'
              ? 'Moving...'
              : pendingOperation === 'creating'
              ? 'Creating...'
              : 'Saving...'}
          </span>
        </div>
      )}

      <div className={styles.taskCardHeader}>
        <div className={styles.taskTitleRow}>
          {task.priority && (
            <span
              className={`${styles.priorityDot} ${priorityClass(task.priority)}`}
              title={`${task.priority} priority`}
            />
          )}
          <div className={styles.taskTitle}>{task.title}</div>
        </div>

        <div className={styles.headerRight}>
          {showStatus && task.status && (
            <span className={`${styles.statusBadge} ${statusClass(task.status)}`}>
              {task.status.replace('-', ' ')}
            </span>
          )}

          {showDropdown && (
            <div
              className={styles.taskMenu}
              data-interactive
              onClick={(e) => {
                e.stopPropagation();
                onDropdownToggle?.(task.id);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
              </svg>
              {openDropdown && (
                <div className={styles.dropdownMenu}>
                  {onViewDetails && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDetails(task.id);
                      }}
                    >
                      View Details
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(task.id);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(task.id);
                    }}
                  >
                    Delete
                  </button>
                  {onMoveToProject && projects.length > 0 && (
                    <div className={styles.moveToProject}>
                      <span>Move to project:</span>
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToProject(task.id, project.id);
                          }}
                        >
                          {project.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {task.project && <div className={styles.taskProject}>{task.project}</div>}

      {task.progress !== undefined && task.totalSteps && task.totalSteps > 0 && (
        <div className={styles.taskProgress}>
          <span>Progress</span>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${
                progressTone === 'ongoing'
                  ? styles.progressFillOngoing
                  : progressTone === 'completed'
                  ? styles.progressFillCompleted
                  : ''
              }`}
              style={{ width: `${Math.min(100, (task.progress / task.totalSteps) * 100)}%` }}
            />
          </div>
          <span className={styles.progressText}>
            {task.progress}/{task.totalSteps}
          </span>
        </div>
      )}

      <div className={styles.taskFooter}>
        <div className={styles.footerLeft}>
          {task.dueDate && (
            <div
              className={`${styles.taskDate} ${
                dueState === 'overdue'
                  ? styles.dueOverdue
                  : dueState === 'today'
                  ? styles.dueToday
                  : dueState === 'soon'
                  ? styles.dueSoon
                  : styles.dueNormal
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {formatDueDate(task.dueDate, dueState)}
            </div>
          )}

          {contributors.length > 0 && (
            <div className={styles.assigneeAvatars} title={contributors.join(', ')}>
              {visibleContributors.map((name) => (
                <span key={name} className={styles.assigneeAvatar}>
                  {getInitials(name)}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className={styles.assigneeOverflow}>+{overflowCount}</span>
              )}
            </div>
          )}
        </div>

        <div className={styles.taskMeta}>
          {task.comments && task.comments.length > 0 && (
            <div className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" fill="currentColor"/>
              </svg>
              {task.comments.length}
            </div>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <div className={styles.metaItem}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor"/>
                <path d="M14 2v6h6" fill="currentColor"/>
              </svg>
              {task.attachments.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default TaskCard;
