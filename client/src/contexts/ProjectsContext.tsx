"use client";

import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

export type Task = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'done';
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
  deleteTasksByStatus: (projectId: number, status: 'all' | Task['status']) => void;
  getProjectTasks: (projectId: number) => Task[];
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

  const deleteTasksByStatus = (projectId: number, status: 'all' | Task['status']) => {
    setTasks((prev) =>
      prev.filter((t) => t.projectId !== projectId || (status !== 'all' && t.status !== status))
    );
  };

  const getProjectTasks = (projectId: number): Task[] => tasks.filter((t) => t.projectId === projectId);

  const value = useMemo(
    () => ({ projects, tasks, selectedProjectId, selectProject, createProject, updateProject, createTask, updateTask, moveTaskStatus, deleteProject, deleteTasksByStatus, getProjectTasks }),
    [projects, tasks, selectedProjectId]
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}


