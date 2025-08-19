"use client";

import React, { useMemo, useState } from 'react';
import WizardModal from '../WizardModal/WizardModal';
import { useProjects } from '../../contexts/ProjectsContext';

export default function EditTaskModal({ taskId, onClose }) {
  const { tasks, updateTask } = useProjects();
  const task = useMemo(() => tasks.find(t => t.id === taskId), [tasks, taskId]);

  const [local, setLocal] = useState({
    title: task?.title || '',
    dueDate: task?.dueDate || '',
    status: task?.status || 'todo',
    description: '',
  });

  if (!taskId) return null;

  const steps = [
    [ { name: 'title', label: 'Task Title', placeholder: 'Task Title', type: 'text' } ],
    [ { name: 'dueDate', label: 'Due Date', type: 'date' }, { name: 'status', label: 'Status', type: 'select', options: ['todo', 'in-progress', 'done'] } ],
    [ { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Update description' } ],
  ];

  return (
    <WizardModal
      isOpen={!!taskId}
      title="Edit task"
      subtitle="Update task details"
      steps={steps}
      ctas={{ submitLabel: 'SAVE' }}
      onClose={onClose}
      onSubmit={(vals) => {
        updateTask(taskId, { title: vals.title || local.title, dueDate: vals.dueDate || local.dueDate, status: vals.status || local.status });
        onClose?.();
      }}
    />
  );
}


