"use client";

import React from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';

export default function CreateTaskModal({ isOpen, onClose, projectId, defaultStatus }) {
  const { createTask } = useProjects();

  const steps = [
    [
      { name: 'title', label: 'Task Title', placeholder: 'Task Title', type: 'text' },
      { name: 'category', label: 'Category', placeholder: 'Select Category', type: 'select', options: ['Design', 'Development', 'Marketing', 'Research'] },
      { name: 'contributors', label: 'Contributors', placeholder: 'Add contributors', type: 'text', helpText: 'You can add up to 50 team members' },
      { name: 'duration', label: 'Task Duration', placeholder: 'Select a duration', type: 'select', options: ['1 day', '3 days', '1 week', '2 weeks'] },
    ],
    [
      { name: 'description', label: 'Description', placeholder: 'Describe the task', type: 'textarea' },
    ],
    [
      { name: 'dueDate', label: 'Due Date', placeholder: '', type: 'date' },
      { name: 'status', label: 'Status', placeholder: 'Select status', type: 'select', options: ['todo', 'in-progress', 'done'] },
    ],
    [
      { name: 'notes', label: 'Notes', placeholder: 'Optional notes', type: 'textarea' },
    ],
  ];

  return (
    <WizardModal
      isOpen={isOpen}
      title="Add new task"
      subtitle="You are creating a new task"
      steps={steps}
      ctas={{ submitLabel: 'CREATE TASK' }}
      onClose={onClose}
      onSubmit={(vals) => {
        createTask(projectId, { title: vals.title, dueDate: vals.dueDate, status: vals.status || defaultStatus || 'todo' });
        onClose?.();
      }}
    />
  );
}

