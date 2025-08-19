"use client";

import React, { useMemo, useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import ProjectWizard from '../../components/ProjectWizard/ProjectWizard';
import { useProjects } from '../../contexts/ProjectsContext';
import EditTaskModal from '../../components/todo/taskEditModal';
import styles from './dashboard.module.scss';
import CreateTaskModal from '../../components/todo/index';

export default function DashboardPage() {
  const { user } = useUser();
  const { projects, tasks, selectedProjectId, createProject, moveTaskStatus } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const currentProjectId = selectedProjectId || projects[0]?.id;
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === currentProjectId), [tasks, currentProjectId]);

  const columns = [
    { key: 'todo', title: 'To do' },
    { key: 'in-progress', title: 'In progress' },
    { key: 'done', title: 'Done' },
  ];

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Welcome back, {user?.username || 'User'} 👋</h1>
          <p>Board view</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addProjectBtn} onClick={() => setIsCreateOpen(true)}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
            New project
          </button>
        </div>
      </div>

      <ProjectWizard
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={(p) => { createProject({ name: p.name, category: p.category }); setIsCreateOpen(false); }}
      />

      <div className={styles.boardWrapper}>
        {columns.map(col => (
          <div key={col.key} className={styles.boardColumn} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{ const id = Number(e.dataTransfer.getData('taskId')); moveTaskStatus(id, col.key); }}>
            <div className={styles.columnHeader}>
              <div className={styles.title}>{col.title} ({projectTasks.filter(t=>t.status===col.key).length})</div>
              {col.key === 'todo' && (
                <button className={styles.addTaskBtn} onClick={() => setEditingTaskId('create-'+col.key)}>+ Add new task</button>
              )}
            </div>
            <div className={styles.cards}>
              {projectTasks.filter(t=>t.status===col.key).map(t => (
                <button key={t.id} className={styles.taskCard} draggable onDragStart={(e)=>{ e.dataTransfer.setData('taskId', String(t.id)); }} onClick={()=> setEditingTaskId(t.id)}>
                  <div className={styles.taskTitle}>{t.title}</div>
                  {t.dueDate && <div className={styles.taskMeta}>{t.dueDate}</div>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <EditTaskModal taskId={typeof editingTaskId === 'number' ? editingTaskId : null} onClose={()=> setEditingTaskId(null)} />
      {typeof editingTaskId === 'string' && (
        <CreateTaskModal isOpen={true} onClose={()=> setEditingTaskId(null)} projectId={currentProjectId} defaultStatus={editingTaskId.split('-')[1]} />
      )}
    </div>
  );
}
