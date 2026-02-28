"use client";

import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProjects } from '../../contexts/ProjectsContext';
import { useUser } from '../../contexts/UserContext';
import styles from './dashboard.module.scss';

// Lazy load heavy modal components
const CreateTaskModal = dynamic(() => import('../../components/todo').then(mod => ({ default: mod.CreateTaskModal })), {
  loading: () => null,
  ssr: false,
});

const TaskEditModal = dynamic(() => import('../../components/todo').then(mod => ({ default: mod.TaskEditModal })), {
  loading: () => null,
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, tasks, selectedProjectId, createProject, moveTaskStatus, deleteProject, updateTask, deleteTask } = useProjects();
  const { user } = useUser();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Debug drag and drop events
    const handleDragStart = (e) => console.log('Global drag start:', e.target);
    const handleDragEnd = (e) => console.log('Global drag end:', e.target);
    const handleDrop = (e) => console.log('Global drop:', e.target);

    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Open create task modal from command palette (Ctrl+K → "New task") or URL ?openCreate=1
  useEffect(() => {
    const handler = () => setIsCreateOpen(true);
    window.addEventListener('command-palette:new-task', handler);
    return () => window.removeEventListener('command-palette:new-task', handler);
  }, []);
  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('openCreate');
      router.replace(url.pathname + (url.search || ''), { scroll: false });
    }
  }, [searchParams, router]);

  const handleDropdownToggle = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  const handleMoveToProject = (taskId, newProjectId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      updateTask(taskId, { projectId: newProjectId });
    }
    setOpenDropdown(null);
  };

  const handleDeleteTask = (taskId) => {
    deleteTask(taskId);
    setOpenDropdown(null);
  };

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

  const handleAddComment = (taskId, commentText) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && commentText.trim()) {
      const newComment = {
        id: Date.now() + Math.random(),
        text: commentText.trim(),
        author: user?.name || 'Unknown User',
        createdAt: new Date()
      };

      const updatedComments = [...(task.comments || []), newComment];
      updateTask(taskId, { comments: updatedComments });
    }
  };

  const handleRemoveComment = (taskId, commentId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.comments) {
      const updatedComments = task.comments.filter(c => c.id !== commentId);
      updateTask(taskId, { comments: updatedComments });
    }
  };

  const handleRemoveAttachment = (taskId, attachmentId) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && task.attachments) {
      const updatedAttachments = task.attachments.filter(a => a.id !== attachmentId);
      updateTask(taskId, { attachments: updatedAttachments });
    }
  };

  const projectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    const filtered = tasks.filter(t => t.projectId === selectedProjectId);
    console.log('Project tasks for', selectedProjectId, ':', filtered);
    return filtered;
  }, [tasks, selectedProjectId]);

  const columns = [
    { key: 'todo', title: 'To Do', color: '#e74c3c' },
    { key: 'in-progress', title: 'In Progress', color: '#f39c12' },
    { key: 'done', title: 'Done', color: '#27ae60' }
  ];

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (!selectedProject) {
    return (
      <div className={styles.dashboardPage}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Dashboard</h1>
            <p>Select a project to get started</p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.addProjectBtn} onClick={() => {
              console.log('Creating project, current projects:', projects);
              createProject({ name: 'New Project' });
            }}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{selectedProject.name}</h1>
          <p>Manage your tasks and track progress</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addProjectBtn} onClick={() => setIsCreateOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>

      <div className={styles.boardWrapper}>
        {columns.map(col => (
          <div
            key={col.key}
            className={styles.boardColumn}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Drop on column container:', col.title);

              // Try multiple data formats
              let taskId = parseInt(e.dataTransfer.getData('taskId'));
              if (!taskId) {
                taskId = parseInt(e.dataTransfer.getData('text/plain'));
              }

              if (taskId) {
                console.log('Moving task:', taskId, 'to status:', col.key);
                moveTaskStatus(taskId, col.key);
                console.log(`Task moved to ${col.title}`);
              } else {
                console.log('No taskId found in column drop event');
              }
            }}
          >
            <div className={styles.columnHeader}>
              <div className={styles.title}>{col.title}</div>
              {col.key === 'todo' && (
                <button
                  className={styles.addTaskBtn}
                  onClick={() => setIsCreateOpen(true)}
                >
                  + Add Task
                </button>
              )}
            </div>
            <div
              className={styles.cards}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Drag over on column:', col.title);
                e.currentTarget.classList.add(styles.dragOver);
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(styles.dragOver);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove(styles.dragOver);

                // Try multiple data formats
                let taskId = parseInt(e.dataTransfer.getData('taskId'));
                if (!taskId) {
                  taskId = parseInt(e.dataTransfer.getData('text/plain'));
                }

                console.log('Drop event triggered:', {
                  taskId,
                  targetStatus: col.key,
                  targetColumn: col.title,
                  dataTransfer: e.dataTransfer,
                  types: e.dataTransfer.types
                });

                if (taskId) {
                  console.log('Moving task:', taskId, 'to status:', col.key);
                  moveTaskStatus(taskId, col.key);
                  // Show a brief success message
                  console.log(`Task moved to ${col.title}`);
                } else {
                  console.log('No taskId found in drop event');
                  console.log('Available data types:', e.dataTransfer.types);
                  console.log('taskId data:', e.dataTransfer.getData('taskId'));
                  console.log('text/plain data:', e.dataTransfer.getData('text/plain'));
                }
              }}
              role="region"
              aria-label={`${col.title} column - drop tasks here`}
              data-column={col.key}
            >
              {projectTasks.filter(t=>{
                const matches = t.status === col.key;
                console.log(`Task ${t.id} (${t.title}) status: ${t.status}, column: ${col.key}, matches: ${matches}`);
                return matches;
              }).map(t => (
                <div
                  key={t.id}
                  className={styles.taskCard}
                  draggable={true}
                  onDragStart={(e)=>{
                    console.log('Drag start for task:', t.id, 'with status:', t.status);
                    e.dataTransfer.setData('taskId', String(t.id));
                    e.dataTransfer.setData('text/plain', String(t.id));
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.dropEffect = 'move';
                    e.currentTarget.classList.add(styles.dragging);

                    // Verify data was set
                    console.log('DataTransfer types:', e.dataTransfer.types);
                    console.log('DataTransfer taskId:', e.dataTransfer.getData('taskId'));
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.classList.remove(styles.dragging);
                  }}
                  onClick={() => setEditingTaskId(t.id)}
                  title="Click to edit task"
                  data-task-id={t.id}
                  data-task-status={t.status}
                >
                  <div className={styles.taskCardHeader}>
                    <div className={styles.taskTitle}>
                      {t.title}
                    </div>
                    <div className={styles.taskStatus}>
                      <span className={`${styles.statusBadge} ${styles[`status${t.status?.charAt(0).toUpperCase() + t.status?.slice(1).replace('-', '')}`]}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className={styles.taskMenu} onClick={(e) => { e.stopPropagation(); handleDropdownToggle(t.id); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM19 13a1 1 0 100-2 1 1 0 000 2zM5 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
                      </svg>
                      {openDropdown === t.id && (
                        <div className={styles.dropdownMenu} ref={dropdownRef}>
                          <button onClick={() => setShowTaskDetails(t.id)}>View Details</button>
                          <button onClick={() => setEditingTaskId(t.id)}>Edit</button>
                          <button onClick={() => handleDeleteTask(t.id)}>Delete</button>
                          <div className={styles.moveToProject}>
                            <span>Move to project:</span>
                            {projects.map(p => (
                              <button key={p.id} onClick={() => handleMoveToProject(t.id, p.id)}>
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {t.project && (
                    <div className={styles.taskProject}>{t.project}</div>
                  )}

                  {t.progress !== undefined && t.totalSteps && t.totalSteps > 0 && (
                    <div className={styles.taskProgress}>
                      <span>Progress</span>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${(t.progress / t.totalSteps) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.progressText}>{t.progress}/{t.totalSteps}</span>
                    </div>
                  )}

                  <div className={styles.taskFooter}>
                    {t.dueDate && (
                      <div className={styles.taskDate}>{formatDate(t.dueDate)}</div>
                    )}
                    <div className={styles.taskMeta}>
                      {t.comments && t.comments.length > 0 && (
                        <div className={styles.metaItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" fill="currentColor"/>
                          </svg>
                          {t.comments.length}
                        </div>
                      )}
                      {t.attachments && t.attachments.length > 0 && (
                        <div className={styles.metaItem}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor"/>
                            <path d="M14 2v6h6" fill="currentColor"/>
                          </svg>
                          {t.attachments.length}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && (
        <div className={styles.taskDetailsModal}>
          <div className={styles.taskDetailsContent}>
            <div className={styles.taskDetailsHeader}>
              <h2>Task Details</h2>
              <button onClick={() => setShowTaskDetails(null)}>×</button>
            </div>
            <div className={styles.taskDetailsBody}>
              {(() => {
                const task = tasks.find(t => t.id === showTaskDetails);
                if (!task) return null;

                return (
                  <>
                    <div className={styles.taskSection}>
                      <h3>Title</h3>
                      <p>{task.title}</p>
                    </div>

                    {task.description && (
                      <div className={styles.taskSection}>
                        <h3>Description</h3>
                        <p>{task.description}</p>
                      </div>
                    )}

                    {task.project && (
                      <div className={styles.taskSection}>
                        <h3>Project</h3>
                        <p>{task.project}</p>
                      </div>
                    )}

                    {task.category && (
                      <div className={styles.taskSection}>
                        <h3>Category</h3>
                        <p>{task.category}</p>
                      </div>
                    )}

                    {task.contributors && task.contributors.length > 0 && (
                      <div className={styles.taskSection}>
                        <h3>Contributors</h3>
                        <p>{task.contributors.join(', ')}</p>
                      </div>
                    )}

                    {task.duration && (
                      <div className={styles.taskSection}>
                        <h3>Duration</h3>
                        <p>{task.duration}</p>
                      </div>
                    )}

                    {task.dueDate && (
                      <div className={styles.taskSection}>
                        <h3>Due Date</h3>
                        <p>{formatDate(task.dueDate)}</p>
                      </div>
                    )}

                    {task.notes && (
                      <div className={styles.taskSection}>
                        <h3>Notes</h3>
                        <p>{task.notes}</p>
                      </div>
                    )}

                    {/* Attachments Section */}
                    <div className={styles.taskSection}>
                      <h3>Attachments ({task.attachments ? task.attachments.length : 0})</h3>
                      {task.attachments && task.attachments.length > 0 ? (
                        <div className={styles.attachmentsList}>
                          {task.attachments.map(attachment => (
                            <div key={attachment.id} className={styles.attachmentItem}>
                              <div className={styles.attachmentInfo}>
                                <div className={styles.attachmentName}>{attachment.name}</div>
                                <div className={styles.attachmentSize}>{formatFileSize(attachment.size)}</div>
                                <div className={styles.attachmentDate}>
                                  {new Date(attachment.uploadedAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className={styles.attachmentActions}>
                                <button className={styles.downloadBtn}>Download</button>
                                <button
                                  className={styles.removeBtn}
                                  onClick={() => handleRemoveAttachment(task.id, attachment.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>No attachments</p>
                      )}
                    </div>

                    {/* Comments Section */}
                    <div className={styles.taskSection}>
                      <h3>Comments ({task.comments ? task.comments.length : 0})</h3>
                      {task.comments && task.comments.length > 0 && (
                        <div className={styles.commentsList}>
                          {task.comments.map(comment => (
                            <div key={comment.id} className={styles.commentItem}>
                              <div className={styles.commentHeader}>
                                <span className={styles.commentAuthor}>{comment.author}</span>
                                <span className={styles.commentDate}>
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className={styles.commentText}>{comment.text}</div>
                              <button
                                className={styles.removeCommentBtn}
                                onClick={() => handleRemoveComment(task.id, comment.id)}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.addCommentSection}>
                        <textarea
                          className={styles.commentTextarea}
                          placeholder="Add a comment..."
                          rows={3}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              const textarea = e.target;
                              handleAddComment(task.id, textarea.value);
                              textarea.value = '';
                            }
                          }}
                        />
                        <button
                          className={styles.addCommentBtn}
                          onClick={(e) => {
                            const textarea = e.target.previousElementSibling;
                            handleAddComment(task.id, textarea.value);
                            textarea.value = '';
                          }}
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={selectedProjectId}
        defaultStatus="todo"
      />

      {/* Task Edit Modal */}
      {editingTaskId && (() => {
        const taskToEdit = tasks.find(t => t.id === editingTaskId);
        if (!taskToEdit) {
          // If task is not found, close the modal
          setEditingTaskId(null);
          return null;
        }
        return (
          <TaskEditModal
            isOpen={!!editingTaskId}
            onClose={() => setEditingTaskId(null)}
            task={taskToEdit}
            projectId={selectedProjectId}
          />
        );
      })()}
    </div>
  );
}
