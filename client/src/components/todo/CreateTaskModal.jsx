"use client";

import React, { useState, useRef } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';
import { useUser } from '../../contexts/UserContext';
import styles from '../WizardModal/wizardModal.module.css';

export default function CreateTaskModal({ isOpen, onClose, projectId, defaultStatus }) {
  const { createTask, createProject, projects } = useProjects();
  const { user } = useUser();
  const currentProject = projects.find(p => p.id === projectId);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    addFiles(files);
    // Reset input
    event.target.value = '';
  };

  const addFiles = (files) => {
    const maxSize = 200 * 1024 * 1024; // 200MB
    
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

  const steps = [
    [
      { name: 'title', label: 'Task Title', placeholder: 'Task Title', type: 'text' },
      { name: 'project', label: 'Project', placeholder: 'Select Project', type: 'select', options: [...projects.map(p => p.name), '+ Create New Project'], defaultValue: currentProject?.name },
      { name: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', options: ['Design', 'Development', 'Marketing', 'Research', 'UX', 'Content'] },
      { name: 'contributors', label: 'Contributors', placeholder: 'Add contributors (comma separated)', type: 'text', helpText: 'You can add up to 50 team members' },
    ],
    [
      { name: 'description', label: 'Description', placeholder: 'Describe the task', type: 'textarea' },
      { name: 'duration', label: 'Task Duration', placeholder: 'Select a duration', type: 'select', options: ['1 day', '3 days', '1 week', '2 weeks', '1 month'] },
    ],
    [
      { name: 'progress', label: 'Progress Steps', placeholder: 'Number of completed steps', type: 'number', helpText: 'e.g., 7' },
      { name: 'totalSteps', label: 'Total Steps', placeholder: 'Total number of steps', type: 'number', helpText: 'e.g., 10' },
      { name: 'dueDate', label: 'Due Date', placeholder: '', type: 'date' },
      { name: 'status', label: 'Status', placeholder: 'Select status', type: 'select', options: ['todo', 'in-progress', 'done'], defaultValue: defaultStatus },
    ],
    [
      { name: 'notes', label: 'Additional Notes', placeholder: 'Optional notes', type: 'textarea' },
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
        label: 'Initial Comments', 
        placeholder: 'Add any initial comments', 
        type: 'custom',
        renderCustom: (field, values, handleChange) => (
          <div className={styles.commentsSection}>
            <h3>Initial Comments</h3>
            <p className={styles.commentsInfo}>Add any initial comments or notes for this task.</p>
            
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
    'Initial Comments'
  ];

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add new task"
      subtitle="You are creating a new task"
      steps={steps}
      stepDescriptions={stepDescriptions}
      ctas={{ submitLabel: 'CREATE TASK' }}
      onSubmit={(vals) => {
        let targetProjectId = projectId;
        let projectName = vals.project;
        
        // Handle "Create New Project" option
        if (vals.project === '+ Create New Project') {
          // Create a new project with a default name
          const newProject = createProject({ name: 'New Project' });
          targetProjectId = newProject.id;
          projectName = newProject.name;
        } else {
          // Find the selected project by name to get its ID
          const selectedProject = projects.find(p => p.name === vals.project);
          if (selectedProject) {
            targetProjectId = selectedProject.id;
          }
        }
        
        createTask(targetProjectId, {
          title: vals.title,
          project: projectName,
          category: vals.category,
          contributors: vals.contributors ? vals.contributors.split(',').map(s => s.trim()) : [],
          description: vals.description,
          duration: vals.duration,
          progress: parseInt(vals.progress) || 0,
          totalSteps: parseInt(vals.totalSteps) || 0,
          dueDate: vals.dueDate,
          status: vals.status || defaultStatus || 'todo',
          attachments: attachments,
          comments: comments,
          notes: vals.notes
        });
        onClose?.();
        // Reset state
        setAttachments([]);
        setComments([]);
        setNewComment('');
      }}
    />
  );
}

