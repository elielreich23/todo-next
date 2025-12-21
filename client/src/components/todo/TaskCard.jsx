"use client";

import React, { memo } from 'react';
import styles from './TaskCard.module.css';

const TaskCard = memo(function TaskCard({
  task,
  onEdit,
  onStatusChange,
  onDelete,
  onMoveToProject,
  projects = [],
  showDropdown = true,
  draggable = false,
  onDragStart,
  className = ''
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCardClick = (e) => {
    // Don't trigger edit if clicking on dropdown or other interactive elements
    if (e.target.closest('[data-interactive]')) {
      return;
    }
    onEdit?.(task.id);
  };

  return (
    <div
      className={`${styles.taskCard} ${className}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={handleCardClick}
      style={{ cursor: onEdit ? 'pointer' : 'default' }}
    >
      <div className={styles.taskCardHeader}>
        <div className={styles.taskTitle}>{task.title}</div>
        {showDropdown && (
          <div className={styles.taskMenu} data-interactive>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
            </svg>
            <div className={styles.dropdownMenu}>
              <button onClick={() => onEdit?.(task.id)}>Edit</button>
              <button onClick={() => onDelete?.(task.id)}>Delete</button>
              {onMoveToProject && projects.length > 0 && (
                <div className={styles.moveToProject}>
                  <span>Move to project:</span>
                  {projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => onMoveToProject(task.id, project.id)}
                    >
                      {project.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {task.project && (
        <div className={styles.taskProject}>{task.project}</div>
      )}

      {task.progress !== undefined && task.totalSteps && task.totalSteps > 0 && (
        <div className={styles.taskProgress}>
          <span>Progress</span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(task.progress / task.totalSteps) * 100}%` }}
            ></div>
          </div>
          <span className={styles.progressText}>{task.progress}/{task.totalSteps}</span>
        </div>
      )}

      <div className={styles.taskFooter}>
        {task.dueDate && (
          <div className={styles.taskDate}>{formatDate(task.dueDate)}</div>
        )}
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
