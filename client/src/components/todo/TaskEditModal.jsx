"use client";

import React, { useState, useEffect } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';
import { api } from '../../lib/api';
import { useUser } from '../../contexts/UserContext';
import TaskFileUpload from './TaskFileUpload';
import TaskCommentsEditor from './TaskCommentsEditor';
import styles from '../WizardModal/wizardModal.module.scss';
import {
  TASK_CATEGORIES,
  TASK_DURATION_OPTIONS,
  TASK_STATUS,
  TASK_PRIORITY_OPTIONS,
  DEFAULTS,
} from '../../constants';

const mapPriorityLabel = (label) => label?.toLowerCase();
const formatPriorityForForm = (priority) => {
  if (!priority) return 'Medium';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export default function TaskEditModal({ isOpen, onClose, task, projectId }) {
  const { updateTask, createProjectAndWait, projects } = useProjects();
  const { user } = useUser();
  const currentProject = projects.find((p) => p.id === projectId);

  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api('/api/auth/users/');
        if (res?.success) setAllUsers(res.users);
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (task) {
      setAttachments(task.attachments || []);
      setComments(task.comments || []);

      if (task.contributors && task.contributors.length > 0 && allUsers.length > 0) {
        const matchedUsers = task.contributors
          .map((contributorName) =>
            allUsers.find(
              (u) =>
                u.full_name === contributorName ||
                u.username === contributorName ||
                u.email === contributorName
            ) || null
          )
          .filter(Boolean);
        setSelectedAssignees(matchedUsers);
      } else {
        setSelectedAssignees([]);
      }
    }
  }, [task, allUsers]);

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

  if (!task) return null;

  const steps = [
    [
      {
        name: 'title',
        label: 'Task Title',
        placeholder: 'Task Title',
        type: 'text',
        defaultValue: task.title,
      },
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
        defaultValue: task.category,
      },
      {
        name: 'priority',
        label: 'Priority',
        placeholder: 'Select Priority',
        type: 'select',
        options: TASK_PRIORITY_OPTIONS,
        defaultValue: formatPriorityForForm(task.priority),
      },
      {
        name: 'description',
        label: 'Description',
        placeholder: 'Describe the task',
        type: 'textarea',
        defaultValue: task.description,
      },
      {
        name: 'duration',
        label: 'Task Duration',
        placeholder: 'Select a duration',
        type: 'select',
        options: TASK_DURATION_OPTIONS,
        defaultValue: task.duration,
      },
      {
        name: 'notes',
        label: 'Additional Notes',
        placeholder: 'Optional notes',
        type: 'textarea',
        defaultValue: task.notes,
      },
    ],
    [
      {
        name: 'assignees',
        label: 'Assignees',
        type: 'custom',
        renderCustom: () => (
          <div className={styles.assigneesPicker}>
            <select
              className={styles.multiSelect}
              multiple
              value={selectedAssignees.map((u) => String(u.id))}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions).map((o) => o.value);
                const picked = allUsers.filter((u) => opts.includes(String(u.id)));
                setSelectedAssignees(picked);
              }}
            >
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.username || u.email}
                </option>
              ))}
            </select>
            {selectedAssignees.length > 0 && (
              <div className={styles.selectedPills}>
                {selectedAssignees.map((u) => (
                  <span key={u.id} className={styles.pill}>
                    {u.full_name || u.username || u.email}
                  </span>
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        name: 'progress',
        label: 'Progress Steps',
        placeholder: 'Number of completed steps',
        type: 'number',
        helpText: 'e.g., 7',
        defaultValue: task.progress?.toString(),
      },
      {
        name: 'totalSteps',
        label: 'Total Steps',
        placeholder: 'Total number of steps',
        type: 'number',
        helpText: 'e.g., 10',
        defaultValue: task.totalSteps?.toString(),
      },
      {
        name: 'dueDate',
        label: 'Due Date',
        placeholder: '',
        type: 'date',
        defaultValue: task.dueDate,
      },
      {
        name: 'status',
        label: 'Status',
        placeholder: 'Select status',
        type: 'select',
        options: Object.values(TASK_STATUS),
        defaultValue: task.status,
      },
    ],
    [
      {
        name: 'fileUpload',
        label: 'File Attachments',
        type: 'custom',
        renderCustom: () => (
          <TaskFileUpload attachments={attachments} onAttachmentsChange={setAttachments} />
        ),
      },
      {
        name: 'comments',
        label: 'Comments',
        type: 'custom',
        renderCustom: () => (
          <TaskCommentsEditor
            comments={comments}
            newComment={newComment}
            onNewCommentChange={setNewComment}
            onAddComment={addComment}
            onRemoveComment={removeComment}
            description="Add new comments or manage existing ones."
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
        if (!isSubmitting) onClose?.();
      }}
      title="Edit Task"
      subtitle={`Editing: ${task.title}`}
      steps={steps}
      stepDescriptions={stepDescriptions}
      ctas={{ submitLabel: 'UPDATE TASK' }}
      isSubmitting={isSubmitting}
      onSubmit={async (vals) => {
        setIsSubmitting(true);

        try {
          let projectName = vals.project;

          if (vals.project === '+ Create New Project') {
            const newProject = await createProjectAndWait({ name: DEFAULTS.PROJECT_NAME });
            projectName = newProject.name;
          }

          await updateTask(task.id, {
            title: vals.title,
            project: projectName,
            category: vals.category,
            priority: mapPriorityLabel(vals.priority) || task.priority || 'medium',
            contributors: selectedAssignees.map((u) => u.full_name || u.username || u.email),
            description: vals.description,
            duration: vals.duration,
            progress: parseInt(vals.progress, 10) || 0,
            totalSteps: parseInt(vals.totalSteps, 10) || 0,
            dueDate: vals.dueDate,
            status: vals.status || task.status,
            attachments,
            comments,
            notes: vals.notes,
          });

          try {
            await api(`/api/tasks/${task.id}/`, {
              method: 'PUT',
              body: JSON.stringify({ assignee_ids: selectedAssignees.map((u) => u.id) }),
            });
          } catch {
            // assignee update is best-effort
          }

          setNewComment('');
          onClose?.();
        } finally {
          setIsSubmitting(false);
        }
      }}
    />
  );
}
