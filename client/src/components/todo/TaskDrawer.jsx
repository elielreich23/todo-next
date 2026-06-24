"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useProjects } from '../../contexts/ProjectsContext';
import { useUser } from '../../contexts/UserContext';
import { formatFileSize } from '../../utils/formatters';
import styles from './TaskDrawer.module.scss';

const TABS = [
  { key: 'details', label: 'Details' },
  { key: 'comments', label: 'Comments' },
  { key: 'files', label: 'Files' },
  { key: 'activity', label: 'Activity' },
];

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

function formatDueDateLabel(dueDate, state) {
  const formatted = new Date(dueDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  if (state === 'overdue') return `Overdue · ${formatted}`;
  if (state === 'today') return `Due today · ${formatted}`;
  if (state === 'soon') return `Due soon · ${formatted}`;
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

export default function TaskDrawer({ taskId, isOpen, onClose, onEdit }) {
  const { tasks, addTaskComment, deleteTaskComment, removeTaskAttachment, isTaskPending, getTaskPendingOperation } = useProjects();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('details');
  const [newComment, setNewComment] = useState('');

  const task = tasks.find((t) => t.id === taskId);
  const isPending = taskId ? isTaskPending(taskId) : false;
  const pendingOp = taskId ? getTaskPendingOperation(taskId) : undefined;

  useEffect(() => {
    if (isOpen) setActiveTab('details');
  }, [isOpen, taskId]);

  const dueState = useMemo(
    () => (task?.dueDate ? getDueDateState(task.dueDate, task.status) : 'normal'),
    [task?.dueDate, task?.status]
  );

  const activityItems = useMemo(() => {
    if (!task) return [];

    const items = [];

    if (task.status) {
      items.push({
        id: 'status',
        text: `Status set to ${task.status.replace('-', ' ')}`,
        date: new Date(),
        type: 'status',
      });
    }

    if (task.dueDate) {
      items.push({
        id: 'due',
        text: `Due date: ${formatDueDateLabel(task.dueDate, dueState)}`,
        date: new Date(task.dueDate),
        type: 'due',
      });
    }

    (task.attachments || []).forEach((attachment) => {
      items.push({
        id: `file-${attachment.id}`,
        text: `File attached: ${attachment.name}`,
        date: new Date(attachment.uploadedAt),
        type: 'file',
      });
    });

    (task.comments || []).forEach((comment) => {
      items.push({
        id: `comment-${comment.id}`,
        text: `${comment.author} commented: "${comment.text}"`,
        date: new Date(comment.createdAt),
        type: 'comment',
      });
    });

    return items.sort((a, b) => b.date - a.date);
  }, [task, dueState]);

  if (!isOpen || !task) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addTaskComment(task.id, newComment.trim(), user?.full_name || 'Unknown');
    setNewComment('');
  };

  const handleRemoveComment = (commentId) => {
    deleteTaskComment(task.id, String(commentId));
  };

  const handleRemoveAttachment = (attachmentId) => {
    removeTaskAttachment(task.id, String(attachmentId));
  };

  return (
    <div className={styles.taskDrawerOverlay} onClick={onClose}>
      <aside className={styles.taskDrawer} onClick={(e) => e.stopPropagation()} aria-label="Task details">
        <div className={styles.drawerHeader}>
          <div className={styles.drawerTitleBlock}>
            <h2 className={styles.drawerTitle}>{task.title}</h2>
            <div className={styles.drawerMeta}>
              <span className={`${styles.statusBadge} ${statusClass(task.status)}`}>
                {task.status?.replace('-', ' ')}
              </span>
              {task.priority && (
                <span className={`${styles.priorityBadge} ${priorityClass(task.priority)}`}>
                  {task.priority}
                </span>
              )}
              {isPending && (
                <span className={styles.priorityBadge} style={{ background: '#eef2ff', color: '#4f46e5' }}>
                  {pendingOp === 'moving' ? 'Moving...' : pendingOp === 'updating' ? 'Saving...' : 'Updating...'}
                </span>
              )}
            </div>
          </div>
          <div className={styles.drawerActions}>
            <button type="button" className={styles.editBtn} onClick={() => onEdit?.(task.id)}>
              Edit
            </button>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>

        <nav className={styles.tabBar} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key === 'comments' && task.comments?.length > 0 && ` (${task.comments.length})`}
              {tab.key === 'files' && task.attachments?.length > 0 && ` (${task.attachments.length})`}
            </button>
          ))}
        </nav>

        <div className={styles.drawerBody}>
          {activeTab === 'details' && (
            <>
              {task.description && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <p className={styles.sectionContent}>{task.description}</p>
                </div>
              )}

              {task.project && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Project</h3>
                  <p className={styles.sectionContent}>{task.project}</p>
                </div>
              )}

              {task.category && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Category</h3>
                  <p className={styles.sectionContent}>{task.category}</p>
                </div>
              )}

              {task.contributors && task.contributors.length > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Assignees</h3>
                  <div className={styles.assigneeList}>
                    {task.contributors.map((name) => (
                      <span key={name} className={styles.assigneeChip}>
                        <span className={styles.assigneeAvatar}>{getInitials(name)}</span>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {task.dueDate && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Due Date</h3>
                  <span
                    className={`${styles.dueDate} ${
                      dueState === 'overdue'
                        ? styles.dueOverdue
                        : dueState === 'today'
                        ? styles.dueToday
                        : dueState === 'soon'
                        ? styles.dueSoon
                        : styles.dueNormal
                    }`}
                  >
                    {formatDueDateLabel(task.dueDate, dueState)}
                  </span>
                </div>
              )}

              {task.duration && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Duration</h3>
                  <p className={styles.sectionContent}>{task.duration}</p>
                </div>
              )}

              {task.totalSteps > 0 && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Progress</h3>
                  <div className={styles.progressBlock}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${Math.min(100, ((task.progress || 0) / task.totalSteps) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.progressLabel}>
                      {task.progress || 0} of {task.totalSteps} steps
                    </span>
                  </div>
                </div>
              )}

              {task.notes && (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Notes</h3>
                  <p className={styles.sectionContent}>{task.notes}</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'comments' && (
            <>
              {task.comments && task.comments.length > 0 ? (
                <div className={styles.commentsList}>
                  {task.comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentMeta}>
                        {comment.author} · {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                      <div className={styles.commentText}>{comment.text}</div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleRemoveComment(comment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>No comments yet</p>
              )}

              <div className={styles.commentInputGroup}>
                <textarea
                  className={styles.commentTextarea}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <button
                  type="button"
                  className={styles.addCommentBtn}
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  Add Comment
                </button>
              </div>
            </>
          )}

          {activeTab === 'files' && (
            <>
              {task.attachments && task.attachments.length > 0 ? (
                <div className={styles.attachmentsList}>
                  {task.attachments.map((attachment) => (
                    <div key={attachment.id} className={styles.attachmentItem}>
                      <div className={styles.attachmentName}>{attachment.name}</div>
                      <div className={styles.attachmentMeta}>
                        {formatFileSize(attachment.size)} ·{' '}
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </div>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        onClick={() => handleRemoveAttachment(attachment.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>No files attached</p>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {activityItems.length > 0 ? (
                <div className={styles.activityList}>
                  {activityItems.map((item) => (
                    <div key={item.id} className={styles.activityItem}>
                      <span className={styles.activityIcon}>
                        {item.type === 'comment' ? '💬' : item.type === 'file' ? '📎' : '•'}
                      </span>
                      <div>
                        <div className={styles.activityText}>{item.text}</div>
                        <div className={styles.activityMeta}>
                          {item.date.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyState}>No activity yet</p>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
