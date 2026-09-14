"use client";

import React, { useMemo, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '../../../../contexts/ProjectsContext';
import projStyles from './project.module.scss';

// Lazy load heavy project/task modals so the detail page can render quickly.
const ProjectWizard = dynamic(() => import('../../../../components/ProjectWizard/ProjectWizard'), {
  loading: () => null,
  ssr: false,
});

const CreateTaskModal = dynamic(() => import('../../../../components/todo').then(mod => ({ default: mod.CreateTaskModal })), {
  loading: () => null,
  ssr: false,
});

const TaskEditModal = dynamic(() => import('../../../../components/todo').then(mod => ({ default: mod.TaskEditModal })), {
  loading: () => null,
  ssr: false,
});

export default function ProjectDetailPage() {
  // Project detail state is driven by the route id plus local form/modal controls.
  const params = useParams();
  const router = useRouter();
  const { projects, updateProject, getProjectTasks, createTask, deleteProject } = useProjects();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const projectId = useMemo(() => Number(params?.id), [params]);
  const project = projects.find((p) => p.id === projectId);

  const [form, setForm] = useState({
    name: project?.name || '',
    category: project?.category || '',
    description: project?.description || '',
    duration: project?.duration || '',
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Guard against stale or invalid project ids in the route.
  if (!project) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Project not found.</p>
        <button onClick={() => router.push('/dashboard')}>Back</button>
      </div>
    );
  }

  const tasks = getProjectTasks(projectId);

  // Project form handlers update local fields first, then persist through ProjectsContext.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateProject(projectId, form);
  };
  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    createTask(projectId, { title: newTaskTitle });
    setNewTaskTitle('');
  };

  return (
    <div className={projStyles.projectPage}>
      {/* Project header offers page-level actions and modal entry points. */}
      <div className={projStyles.pageHeader}>
        <h2>{project.name}</h2>
        <div className={projStyles.actions}>
          <button className={projStyles.button}>Filter</button>
          <button className={projStyles.button}>Sort</button>
          <button className={`${projStyles.button} ${projStyles.newTemplateButton}`} onClick={() => setIsCreateProjectOpen(true)}>New template</button>
          <button className={projStyles.button} onClick={() => setIsCreateTaskOpen(true)}>Create task</button>

        </div>
      </div>

      {/* Detail grid separates editable project metadata from the project's task list. */}
      <div className={projStyles.contentGrid}>
        <div className={projStyles.card}>
          {/* Project metadata form updates title, category, duration, description, and deletion. */}
          <h3>Project details</h3>
          <div className={projStyles.fieldGroup}>
            <label className={projStyles.label}>Title</label>
            <input className={projStyles.input} name="name" value={form.name} onChange={handleChange} />
            <label className={projStyles.label}>Category</label>
            <input className={projStyles.input} name="category" value={form.category} onChange={handleChange} />
            <label className={projStyles.label}>Duration</label>
            <input className={projStyles.input} name="duration" value={form.duration} onChange={handleChange} />
            <label className={projStyles.label}>Description</label>
            <textarea className={projStyles.textarea} name="description" rows={5} value={form.description} onChange={handleChange} />
            <div className={projStyles.inlineActions}>
              <button className={projStyles.primaryBtn} onClick={handleSave}>Save changes</button>
              <button className={projStyles.dangerBtn} onClick={() => { if (confirm('Delete this project? This will remove all its tasks.')) { deleteProject(projectId); router.push('/dashboard'); } }}>Delete</button>
            </div>
          </div>
        </div>

        <div className={projStyles.card}>
          {/* Project tasks can be created inline or opened for richer editing. */}
          <h3>Project tasks</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input className={projStyles.input} value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Task title" />
            <button className={projStyles.primaryBtn} onClick={handleCreateTask}>Create task</button>
          </div>
          <ul className={projStyles.taskList}>
            {tasks.map((t) => (
              <li
                key={t.id}
                className={projStyles.taskItem}
                onClick={() => setEditingTaskId(t.id)}
                style={{ cursor: 'pointer' }}
              >
                {t.title}
              </li>
            ))}
            {tasks.length === 0 && <li className={projStyles.empty}>No tasks yet.</li>}
          </ul>
        </div>
      </div>

      {/* Shared project/task modals keep create and edit behavior aligned with the main board. */}
      <ProjectWizard isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} onCreate={() => setIsCreateProjectOpen(false)} />
      <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} projectId={projectId} />

      {/* Task edit modal opens for the selected project task. */}
      {editingTaskId && (
        <TaskEditModal
          isOpen={!!editingTaskId}
          onClose={() => setEditingTaskId(null)}
          task={tasks.find(t => t.id === editingTaskId)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
