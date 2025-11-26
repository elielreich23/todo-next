"use client";

import React, { useState, useRef, useEffect } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';
import { api } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import styles from '../WizardModal/wizardModal.module.css';

export default function TaskEditModal({ isOpen, onClose, task, projectId }) {
  const { updateTask, createProject, createProjectAndWait, projects } = useProjects();
  const { user } = useUser();
  const currentProject = projects.find(p => p.id === projectId);

  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  useEffect(() => {
    // Load users to assign
    (async () => {
      try {
        const res = await api('/api/auth/users/');
        if (res?.success) setAllUsers(res.users);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (task) {
      setAttachments(task.attachments || []);
      setComments(task.comments || []);

      // Prefill assignees by matching contributor names to actual user objects
      if (task.contributors && task.contributors.length > 0 && allUsers.length > 0) {
        const matchedUsers = task.contributors
          .map(contributorName => {
            // Try to find a user that matches by full_name, username, or email
            const matchedUser = allUsers.find(user =>
              user.full_name === contributorName ||
              user.username === contributorName ||
              user.email === contributorName
            );
            return matchedUser || null;
          })
          .filter(user => user !== null); // Remove any null matches
        setSelectedAssignees(matchedUsers);
      } else if (task.contributors && task.contributors.length > 0) {
        // If users haven't loaded yet, set empty array (will be updated when users load)
        setSelectedAssignees([]);
      } else {
        setSelectedAssignees([]);
      }
    }
  }, [task, allUsers]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    addFiles(files);
    event.target.value = '';
  };

  const addFiles = (files) => {
    const maxSize = 200 * 1024 * 1024;

    files.forEach(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 200MB.`);
        return;
      }

      const attachment = {
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        uploadedAt: new Date(),
        uploadedBy: user?.fullName || 'Unknown User'
      };

      setAttachments(prev => [...prev, attachment]);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeFile = (fileId) => {
    setAttachments(prev => prev.filter(f => f.id !== fileId));
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now() + Math.random(),
        text: newComment.trim(),
        author: user?.fullName || 'Unknown User',
        createdAt: new Date()
      };
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
  };

  const removeComment = (commentId) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!task) return null;

  const steps = [
    [
      {
        name: 'title',
        label: 'Task Title',
        placeholder: 'Task Title',
        type: 'text',
        defaultValue: task.title
      },
      {
        name: 'project',
        label: 'Project',
        placeholder: 'Select Project',
        type: 'select',
        options: [...projects.map(p => p.name), '+ Create New Project'],
        defaultValue: currentProject?.name
      },
      {
        name: 'category',
        label: 'Category',
        placeholder: 'Select Category',
        type: 'select',
        options: ['Design', 'Development', 'Marketing', 'Research', 'UX', 'Content'],
        defaultValue: task.category
      },
      {
        name: 'assignees',
        label: 'Contributors',
        type: 'custom',
        renderCustom: () => (
          <div className={styles.assigneesPicker}>
            <select
              className={styles.multiSelect}
              multiple
              value={selectedAssignees.map(u => String(u.id))}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map(o => o.value);
                const picked = allUsers.filter(u => opts.includes(String(u.id)));
                setSelectedAssignees(picked);
              }}
            >
              {allUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.username || u.email}</option>
              ))}
            </select>
            {selectedAssignees.length > 0 && (
              <div className={styles.selectedPills}>
                {selectedAssignees.map(u => (
                  <span key={u.id} className={styles.pill}>{u.full_name || u.username || u.email}</span>
                ))}
              </div>
            )}
          </div>
        )
      },
    ],
    [
      {
        name: 'description',
        label: 'Description',
        placeholder: 'Describe the task',
        type: 'textarea',
        defaultValue: task.description
      },
      {
        name: 'duration',
        label: 'Task Duration',
        placeholder: 'Select a duration',
        type: 'select',
        options: ['1 day', '3 days', '1 week', '2 weeks', '1 month'],
        defaultValue: task.duration
      },
    ],
    [
      {
        name: 'progress',
        label: 'Progress Steps',
        placeholder: 'Number of completed steps',
        type: 'number',
        helpText: 'e.g., 7',
        defaultValue: task.progress?.toString()
      },
      {
        name: 'totalSteps',
        label: 'Total Steps',
        placeholder: 'Total number of steps',
        type: 'number',
        helpText: 'e.g., 10',
        defaultValue: task.totalSteps?.toString()
      },
      {
        name: 'dueDate',
        label: 'Due Date',
        placeholder: '',
        type: 'date',
        defaultValue: task.dueDate
      },
      {
        name: 'status',
        label: 'Status',
        placeholder: 'Select status',
        type: 'select',
        options: ['todo', 'in-progress', 'done'],
        defaultValue: task.status
      },
    ],
    [
      {
        name: 'notes',
        label: 'Additional Notes',
        placeholder: 'Optional notes',
        type: 'textarea',
        defaultValue: task.notes
      },
    ],
    [
      {
        name: 'fileUpload',
        label: 'File Attachments',
        placeholder: 'Upload files up to 200MB',
        type: 'custom',
        renderCustom: (field, values, handleChange) => (
          <div className={styles.fileUploadSection}>
            <h3>File Attachments</h3>
            <p className={styles.uploadInfo}>Upload files up to 200MB. Drag and drop or click to select.</p>

            <div
              className={`${styles.fileUploadArea} ${isDragOver ? styles.dragOver : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileUpload}
                className={styles.fileInput}
              />
              <label className={styles.fileUploadLabel}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="currentColor"/>
                  <path d="M14 2v6h6" fill="currentColor"/>
                </svg>
                <span>Click to upload files or drag and drop</span>
                <span>Max size: 200MB per file</span>
              </label>
            </div>

            {attachments.length > 0 && (
              <div className={styles.uploadedFiles}>
                <h4>Selected Files ({attachments.length})</h4>
                {attachments.map(file => (
                  <div key={file.id} className={styles.fileItem}>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>
                        {formatFileSize(file.size)} • {file.type || 'Unknown type'}
                      </div>
                    </div>
                    <button
                      className={styles.removeFileBtn}
                      onClick={() => removeFile(file.id)}
                      type="button"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      },
    ],
    [
      {
        name: 'comments',
        label: 'Comments',
        placeholder: 'Add any comments',
        type: 'custom',
        renderCustom: (field, values, handleChange) => (
          <div className={styles.commentsSection}>
            <h3>Comments</h3>
            <p className={styles.commentsInfo}>Add new comments or manage existing ones.</p>

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
                onClick={addComment}
                disabled={!newComment.trim()}
              >
                Add Comment
              </button>
            </div>

            {comments.length > 0 && (
              <div className={styles.commentsList}>
                <h4>Comments ({comments.length})</h4>
                {comments.map(comment => (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentInfo}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentAuthor}>{comment.author}</span>
                        <span className={styles.commentDate}>
                          {comment.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                      <div className={styles.commentText}>{comment.text}</div>
                    </div>
                    <button
                      type="button"
                      className={styles.removeCommentBtn}
                      onClick={() => removeComment(comment.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      },
    ],
  ];

  const stepDescriptions = [
    'Basic Information',
    'Task Details',
    'Progress & Timeline',
    'Additional Notes',
    'File Attachments',
    'Comments'
  ];

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Task"
      subtitle={`Editing: ${task.title}`}
      steps={steps}
      stepDescriptions={stepDescriptions}
      ctas={{ submitLabel: 'UPDATE TASK' }}
      onSubmit={async (vals) => {
        let projectName = vals.project;

        // Handle "Create New Project" option
        if (vals.project === '+ Create New Project') {
          // Create a new project with a default name and wait for real id
          const newProject = await createProjectAndWait({ name: 'New Project' });
          projectName = newProject.name;
          // Note: We don't change the task's projectId here since updateTask doesn't support that
          // The task will remain in its current project but show the new project name
        }

        updateTask(task.id, {
          title: vals.title,
          project: projectName,
          category: vals.category,
          // keep local display contributors; server uses assignee ids
          contributors: selectedAssignees.map(u => u.full_name || u.username || u.email),
          description: vals.description,
          duration: vals.duration,
          progress: parseInt(vals.progress) || 0,
          totalSteps: parseInt(vals.totalSteps) || 0,
          dueDate: vals.dueDate,
          status: vals.status || task.status,
          attachments: attachments,
          comments: comments,
          notes: vals.notes
        });
        // Send assignees to server
        try {
          await fetch(`/api/tasks/${task.id}/`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ assignee_ids: selectedAssignees.map(u => u.id) })
          });
        } catch {}
        onClose?.();
        setNewComment('');
      }}
    />
  );
}
