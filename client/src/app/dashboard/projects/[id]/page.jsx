"use client";

import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '../../../../contexts/ProjectsContext';
import ProjectWizard from '../../../../components/ProjectWizard/ProjectWizard';
import { CreateTaskModal, TaskEditModal } from '../../../../components/todo';
import projStyles from './project.module.scss';

export default function ProjectDetailPage() {
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

  if (!project) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Project not found.</p>
        <button onClick={() => router.push('/dashboard')}>Back</button>
      </div>
    );
  }

  const tasks = getProjectTasks(projectId);

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
      <div className={projStyles.pageHeader}>
        <h2>{project.name}</h2>
        <div className={projStyles.actions}>
          <button className={projStyles.button}>Filter</button>
          <button className={projStyles.button}>Sort</button>
          <button className={`${projStyles.button} ${projStyles.newTemplateButton}`} onClick={() => setIsCreateProjectOpen(true)}>New template</button>
          <button className={projStyles.button} onClick={() => setIsCreateTaskOpen(true)}>Create task</button>
          
        </div>
      </div>

      <div className={projStyles.contentGrid}>
        <div className={projStyles.card}>
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

      <ProjectWizard isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} onCreate={() => setIsCreateProjectOpen(false)} />
      <CreateTaskModal isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} projectId={projectId} />
      
      {/* Task Edit Modal */}
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


