"use client";

import React, { createContext, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { api } from '../lib/api';

export type Task = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'done';
  description?: string;
  project?: string;
  progress?: number;
  totalSteps?: number;
  attachments?: FileAttachment[];
  comments?: TaskComment[];
  category?: string;
  contributors?: string[];
  duration?: string;
  notes?: string;
};

export type FileAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
  uploadedBy: string;
};

export type TaskComment = {
  id: string;
  text: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
};

export type Project = {
  id: number;
  name: string;
  category?: string;
  contributors?: string[];
  duration?: string;
  description?: string;
};

type ProjectsContextType = {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: number | null;
  selectProject: (id: number | null) => void;
  createProject: (data: Partial<Project>) => Project;
  updateProject: (id: number, updates: Partial<Project>) => void;
  createTask: (projectId: number, data: Partial<Task>) => Task;
  updateTask: (id: number, updates: Partial<Task>) => void;
  moveTaskStatus: (id: number, status: Task['status']) => void;
  deleteProject: (id: number) => void;
  deleteTask: (id: number) => void;
  deleteTasksByStatus: (projectId: number, status: 'all' | Task['status']) => void;
  getProjectTasks: (projectId: number) => Task[];
  addTaskAttachment: (taskId: number, file: File, uploadedBy: string) => void;
  removeTaskAttachment: (taskId: number, attachmentId: string) => void;
  addTaskComment: (taskId: number, text: string, author: string) => void;
  updateTaskComment: (taskId: number, commentId: string, text: string) => void;
  deleteTaskComment: (taskId: number, commentId: string) => void;
};

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const useProjects = (): ProjectsContextType => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectsProvider');
  return ctx;
};

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(1);

  // Initial load of projects and default project's tasks
  useEffect(() => {
    (async () => {
      const loadedProjects = await api<Project[]>('/api/projects');
      setProjects(loadedProjects);
      const initialProjectId = loadedProjects[0]?.id ?? null;
      setSelectedProjectId(initialProjectId);
      if (initialProjectId) {
        const loadedTasks = await api<Task[]>(`/api/tasks?projectId=${initialProjectId}`);
        setTasks(loadedTasks);
      }
    })().catch(() => {});
  }, []);

  // When selected project changes, load its tasks
  useEffect(() => {
    if (!selectedProjectId) { setTasks([]); return; }
    (async () => {
      const loadedTasks = await api<Task[]>(`/api/tasks?projectId=${selectedProjectId}`);
      setTasks(loadedTasks);
    })().catch(() => {});
  }, [selectedProjectId]);

  const selectProject = (id: number | null) => setSelectedProjectId(id);

  const createProject = (data: Partial<Project>): Project => {
    const payload = { name: data.name, category: data.category, contributors: data.contributors, duration: data.duration, description: data.description };
    // optimistic update
    const temp: Project = { id: Date.now(), name: payload.name || 'Untitled project', category: payload.category, contributors: payload.contributors, duration: payload.duration, description: payload.description };
    setProjects(prev => [temp, ...prev]);
    api<Project>('/api/projects', { method: 'POST', body: JSON.stringify(payload) })
      .then(created => {
        setProjects(prev => [created, ...prev.filter(p => p.id !== temp.id)]);
        setSelectedProjectId(created.id);
      })
      .catch(() => {});
    return temp;
  };

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => (p.id === id ? { ...p, ...updates } : p)));
    api<Project>('/api/projects', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }).catch(() => {});
  };

  const createTask = (projectId: number, data: Partial<Task>): Task => {
    const payload = { projectId, ...data };
    const temp: Task = {
      id: Date.now(),
      projectId,
      title: data.title !== undefined ? data.title : "New Task",
      dueDate: data.dueDate,
      status: data.status || 'todo',
      description: data.description,
      project: data.project,
      progress: data.progress || 0,
      totalSteps: data.totalSteps || 0,
      attachments: data.attachments || [],
      comments: data.comments || [],
      category: data.category,
      contributors: data.contributors,
      duration: data.duration,
      notes: data.notes,
    };
    setTasks(prev => [temp, ...prev]);
    api<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(payload) })
      .then(created => setTasks(prev => [created, ...prev.filter(t => t.id !== temp.id)]))
      .catch(() => {});
    return temp;
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
    api<Task>('/api/tasks', { method: 'PUT', body: JSON.stringify({ id, ...updates }) }).catch(() => {});
  };

  const moveTaskStatus = (id: number, status: Task['status']) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)));
    api<Task>('/api/tasks', { method: 'PUT', body: JSON.stringify({ id, status }) }).catch(() => {});
  };

  const deleteProject = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
    setSelectedProjectId(prev => (prev === id ? null : prev));
    api<void>(`/api/projects?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    api<void>(`/api/tasks?id=${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const deleteTasksByStatus = (projectId: number, status: 'all' | Task['status']) => {
    const toDelete = tasks.filter(t => t.projectId === projectId && (status === 'all' || t.status === status));
    setTasks(prev => prev.filter(t => !toDelete.some(d => d.id === t.id)));
    toDelete.forEach(t => api<void>(`/api/tasks?id=${t.id}`, { method: 'DELETE' }).catch(() => {}));
  };

  const getProjectTasks = (projectId: number): Task[] => tasks.filter((t) => t.projectId === projectId);

  const addTaskAttachment = (taskId: number, file: File, uploadedBy: string) => {
    const attachment: FileAttachment = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      uploadedBy,
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, attachments: [...(t.attachments || []), attachment] }
          : t
      )
    );
  };

  const removeTaskAttachment = (taskId: number, attachmentId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, attachments: (t.attachments || []).filter((a) => a.id !== attachmentId) }
          : t
      )
    );
  };

  const addTaskComment = (taskId: number, text: string, author: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []), { id: Date.now().toString(), text, author, createdAt: new Date() }] } : t));
    api<TaskComment>(`/api/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ text, author }) })
      .then(serverComment => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: [...(t.comments || []).filter(c => typeof c.id === 'string' && c.id.length > 10), { ...serverComment, createdAt: new Date(serverComment.createdAt) as unknown as Date }] } : t)))
      .catch(() => {});
  };

  const updateTaskComment = (taskId: number, commentId: string, text: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: (t.comments || []).map(c => c.id === commentId ? { ...c, text, updatedAt: new Date() } : c) } : t));
    api(`/api/tasks/${taskId}/comments`, { method: 'PUT', body: JSON.stringify({ commentId, text }) }).catch(() => {});
  };

  const deleteTaskComment = (taskId: number, commentId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, comments: (t.comments || []).filter(c => c.id !== commentId) } : t));
    api<void>(`/api/tasks/${taskId}/comments?commentId=${commentId}`, { method: 'DELETE' }).catch(() => {});
  };

  const value = useMemo(
    () => ({ 
      projects, 
      tasks, 
      selectedProjectId, 
      selectProject, 
      createProject, 
      updateProject, 
      createTask, 
      updateTask, 
      moveTaskStatus, 
      deleteProject, 
      deleteTask, 
      deleteTasksByStatus, 
      getProjectTasks,
      addTaskAttachment,
      removeTaskAttachment,
      addTaskComment,
      updateTaskComment,
      deleteTaskComment
    }),
    [projects, tasks, selectedProjectId]
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}


