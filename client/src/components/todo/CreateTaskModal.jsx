"use client";

import React, { useState } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';
import { useUser } from '../../contexts/UserContext';
import UserAutocomplete from '../UserAutocomplete/UserAutocomplete';
import TaskFileUpload from './TaskFileUpload';
import TaskCommentsEditor from './TaskCommentsEditor';
import styles from '../WizardModal/wizardModal.module.scss';
import {
  TASK_CATEGORIES,
  TASK_DURATION_OPTIONS,
  TASK_STATUS,
  TASK_PRIORITY_OPTIONS,
  DEFAULTS,
  VALIDATION,
} from '../../constants';

const mapPriorityLabel = (label) => label?.toLowerCase();

export default function CreateTaskModal({ isOpen, onClose, projectId, defaultStatus }) {
  const { createTask, createProjectAndWait, projects } = useProjects();
  const { user } = useUser();
  const currentProject = projects.find((p) => p.id === projectId);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedContributors, setSelectedContributors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const addComment = () => {
    if (newComment.trim()) {
      setComments((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          text: newComment.trim(),
          author: user?.full_name || DEFAULTS.UNKNOWN_USER,
          createdAt: new Date(),
        },
      ]);
      setNewComment('');
    }
  };

  const removeComment = (commentId) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const resetForm = () => {
    setAttachments([]);
    setComments([]);
    setNewComment('');
    setSelectedContributors([]);
    setSubmitError('');
  };

  const steps = [
    [
      { name: 'title', label: 'Task Title', placeholder: 'Task Title', type: 'text' },
      {
        name: 'project',
        label: 'Project',
        placeholder: 'Select Project',
        type: 'select',
        options: [...projects.map((p) => p.name), '+ Create New Project'],
        defaultValue: currentProject?.name,
      },
      {
        name: 'category',
        label: 'Category',
        placeholder: 'Select Category',
        type: 'select',
        options: TASK_CATEGORIES,
      },
      {
        name: 'priority',
        label: 'Priority',
        placeholder: 'Select Priority',
        type: 'select',
        options: TASK_PRIORITY_OPTIONS,
        defaultValue: 'Medium',
      },
      {
        name: 'description',
        label: 'Description',
        placeholder: 'Describe the task',
        type: 'textarea',
      },
      {
        name: 'duration',
        label: 'Task Duration',
        placeholder: 'Select a duration',
        type: 'select',
        options: TASK_DURATION_OPTIONS,
      },
      {
        name: 'notes',
        label: 'Additional Notes',
        placeholder: 'Optional notes',
        type: 'textarea',
      },
    ],
    [
      {
        name: 'contributors',
        label: 'Assignees',
        placeholder: 'Search and add contributors...',
        type: 'custom',
        helpText: `You can add up to ${VALIDATION.MAX_CONTRIBUTORS} team members`,
        renderCustom: () => (
          <UserAutocomplete
            selectedUsers={selectedContributors}
            onUsersChange={setSelectedContributors}
            placeholder="Search and add contributors..."
            maxUsers={VALIDATION.MAX_CONTRIBUTORS}
          />
        ),
      },
      {
        name: 'progress',
        label: 'Progress Steps',
        placeholder: 'Number of completed steps',
        type: 'number',
        helpText: 'e.g., 7',
      },
      {
        name: 'totalSteps',
        label: 'Total Steps',
        placeholder: 'Total number of steps',
        type: 'number',
        helpText: 'e.g., 10',
      },
      { name: 'dueDate', label: 'Due Date', placeholder: '', type: 'date' },
      {
        name: 'status',
        label: 'Status',
        placeholder: 'Select status',
        type: 'select',
        options: Object.values(TASK_STATUS),
        defaultValue: defaultStatus,
      },
    ],
    [
      {
        name: 'fileUpload',
        label: 'File Attachments',
        type: 'custom',
        renderCustom: () => (
          <TaskFileUpload
            attachments={attachments}
            onAttachmentsChange={setAttachments}
            title="File Attachments"
          />
        ),
      },
      {
        name: 'comments',
        label: 'Initial Comments',
        type: 'custom',
        renderCustom: () => (
          <TaskCommentsEditor
            comments={comments}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={addComment}
            onRemoveComment={removeComment}
            title="Initial Comments"
            description="Add any initial comments or notes for this task."
          />
        ),
      },
    ],
  ];

  const stepDescriptions = ['Basics', 'Timeline & Assignees', 'Files & Comments'];

  return (
    <WizardModal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) {
          resetForm();
          onClose?.();
        }
      }}
      title="Add new task"
      subtitle="You are creating a new task"
      steps={steps}
      stepDescriptions={stepDescriptions}
      ctas={{ submitLabel: 'CREATE TASK' }}
      isSubmitting={isSubmitting}
      error={submitError}
      onSubmit={async (vals) => {
        setIsSubmitting(true);
        setSubmitError('');

        try {
          let targetProjectId = projectId;
          let projectName = vals.project;

          if (vals.project === '+ Create New Project') {
            const newProject = await createProjectAndWait({ name: DEFAULTS.PROJECT_NAME });
            targetProjectId = newProject.id;
            projectName = newProject.name;
          } else {
            const selectedProject = projects.find((p) => p.name === vals.project);
            if (selectedProject) {
              targetProjectId = selectedProject.id;
            }
          }

          await createTask(targetProjectId, {
            title: vals.title,
            project: projectName,
            category: vals.category,
            priority: mapPriorityLabel(vals.priority) || 'medium',
            contributors: selectedContributors,
            description: vals.description,
            duration: vals.duration,
            progress: parseInt(vals.progress, 10) || 0,
            totalSteps: parseInt(vals.totalSteps, 10) || 0,
            dueDate: vals.dueDate,
            status: vals.status || defaultStatus || TASK_STATUS.TODO,
            attachments,
            comments,
            notes: vals.notes,
          });

          resetForm();
          onClose?.();
        } catch (error) {
          setSubmitError(error instanceof Error ? error.message : 'Failed to create task.');
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
  );
}
