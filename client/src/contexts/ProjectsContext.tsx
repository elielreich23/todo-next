"use client";

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

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
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: 'Design system', category: 'Design' },
    { id: 2, name: 'User flow', category: 'UX' },
    { id: 3, name: 'Ux research', category: 'Research' },
  ]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(1);

  const selectProject = (id: number | null) => setSelectedProjectId(id);

  const createProject = (data: Partial<Project>): Project => {
    const project: Project = {
      id: Date.now(),
      name: data.name || 'Untitled project',
      category: data.category || 'General',
      contributors: data.contributors || [],
      duration: data.duration,
      description: data.description,
    };
    setProjects((prev) => [project, ...prev]);
    setSelectedProjectId(project.id);
    return project;
  };

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const createTask = (projectId: number, data: Partial<Task>): Task => {
    const task: Task = {
      id: Date.now(),
      projectId,
      title: data.title || 'Untitled task',
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
    setTasks((prev) => [task, ...prev]);
    return task;
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const moveTaskStatus = (id: number, status: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteProject = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setSelectedProjectId((prev) => (prev === id ? null : prev));
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteTasksByStatus = (projectId: number, status: 'all' | Task['status']) => {
    setTasks((prev) =>
      prev.filter((t) => t.projectId !== projectId || (status !== 'all' && t.status !== status))
    );
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
    const comment: TaskComment = {
      id: Date.now().toString(),
      text,
      author,
      createdAt: new Date(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []), comment] }
          : t
      )
    );
  };

  const updateTaskComment = (taskId: number, commentId: string, text: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: (t.comments || []).map((c) =>
                c.id === commentId ? { ...c, text, updatedAt: new Date() } : c
              ),
            }
          : t
      )
    );
  };

  const deleteTaskComment = (taskId: number, commentId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: (t.comments || []).filter((c) => c.id !== commentId) }
          : t
      )
    );
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


