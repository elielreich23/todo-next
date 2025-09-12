"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { api } from "../lib/api";

// -------------------- TYPES --------------------

export type Task = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string;
  status?: "todo" | "in-progress" | "done";
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
  color?: string;
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
  moveTaskStatus: (id: number, status: Task["status"]) => void;
  deleteProject: (id: number) => void;
  deleteTask: (id: number) => void;
  deleteTasksByStatus: (
    projectId: number,
    status: "all" | Task["status"]
  ) => void;
  getProjectTasks: (projectId: number) => Task[];
  addTaskAttachment: (taskId: number, file: File, uploadedBy: string) => void;
  removeTaskAttachment: (taskId: number, attachmentId: string) => void;
  addTaskComment: (taskId: number, text: string, author: string) => void;
  updateTaskComment: (
    taskId: number,
    commentId: string,
    text: string
  ) => void;
  deleteTaskComment: (taskId: number, commentId: string) => void;
};

// -------------------- CONTEXT --------------------

const ProjectsContext = createContext<ProjectsContextType | undefined>(
  undefined
);

export const useProjects = (): ProjectsContextType => {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error("useProjects must be used within a ProjectsProvider");
  return ctx;
};

// -------------------- PROVIDER --------------------

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Initial load of projects and tasks
  useEffect(() => {
    (async () => {
      try {
        const response = await api<{ success: boolean; projects: Project[] }>(
          "/api/projects"
        );
        if (response.success) {
          setProjects(response.projects);
          const initialProjectId = response.projects[0]?.id ?? null;
          setSelectedProjectId(initialProjectId);
          if (initialProjectId) {
            const tasksResponse = await api<{
              success: boolean;
              tasks: Task[];
            }>(`/api/tasks?projectId=${initialProjectId}`);
            if (tasksResponse.success) {
              setTasks(tasksResponse.tasks);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    })();
  }, []);

  // When selected project changes, load its tasks
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    (async () => {
      try {
        const response = await api<{ success: boolean; tasks: Task[] }>(
          `/api/tasks?projectId=${selectedProjectId}`
        );
        if (response.success) {
          setTasks(response.tasks);
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      }
    })();
  }, [selectedProjectId]);

  // -------------------- ACTIONS --------------------

  const selectProject = (id: number | null) => setSelectedProjectId(id);

  const createProject = (data: Partial<Project>): Project => {
    const payload = {
      name: data.name,
      description: data.description,
      color: data.color || "#6366f1",
    };

    const temp: Project = {
      id: Date.now(),
      name: payload.name || "Untitled project",
      description: payload.description,
      color: payload.color,
    };
    setProjects((prev) => [temp, ...prev]);

    api<{ success: boolean; project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.success) {
          setProjects((prev) => [
            response.project,
            ...prev.filter((p) => p.id !== temp.id),
          ]);
          setSelectedProjectId(response.project.id);
        }
      })
      .catch(() => {
        setProjects((prev) => prev.filter((p) => p.id !== temp.id));
      });

    return temp;
  };

  const updateProject = (id: number, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    api<{ success: boolean; project: Project }>(`/api/projects/${id}/`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  const createTask = (projectId: number, data: Partial<Task>): Task => {
    const payload = {
      project: projectId,
      title: data.title || "New Task",
      description: data.description,
      status: data.status || "todo",
      due_date: data.dueDate,
    };

    const temp: Task = {
      id: Date.now(),
      projectId,
      title: data.title || "New Task",
      dueDate: data.dueDate,
      status: data.status || "todo",
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
    setTasks((prev) => [temp, ...prev]);

    api<{ success: boolean; task: Task }>("/api/tasks/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.success) {
          setTasks((prev) => [
            response.task,
            ...prev.filter((t) => t.id !== temp.id),
          ]);
        }
      })
      .catch(() => {
        setTasks((prev) => prev.filter((t) => t.id !== temp.id));
      });

    return temp;
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }).catch(() => {});
  };

  const moveTaskStatus = (id: number, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  const deleteProject = (id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setSelectedProjectId((prev) => (prev === id ? null : prev));
    api<void>(`/api/projects/${id}/`, { method: "DELETE" }).catch(() => {});
  };

  const deleteTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api<void>(`/api/tasks/${id}/`, { method: "DELETE" }).catch(() => {});
  };

  const deleteTasksByStatus = (
    projectId: number,
    status: "all" | Task["status"]
  ) => {
    const toDelete = tasks.filter(
      (t) =>
        t.projectId === projectId &&
        (status === "all" || t.status === status)
    );
    setTasks((prev) =>
      prev.filter((t) => !toDelete.some((d) => d.id === t.id))
    );
    toDelete.forEach((t) =>
      api<void>(`/api/tasks/${t.id}/`, { method: "DELETE" }).catch(() => {})
    );
  };

  const getProjectTasks = (projectId: number): Task[] =>
    tasks.filter((t) => t.projectId === projectId);

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
          ? {
              ...t,
              attachments: (t.attachments || []).filter(
                (a) => a.id !== attachmentId
              ),
            }
          : t
      )
    );
  };

  const addTaskComment = (taskId: number, text: string, author: string) => {
    const tempComment: TaskComment = {
      id: Date.now().toString(),
      text,
      author,
      createdAt: new Date(),
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []), tempComment] }
          : t
      )
    );

    api<TaskComment>(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ text, author }),
    })
      .then((serverComment) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: [
                    ...(t.comments || []).filter(
                      (c) => c.id !== tempComment.id
                    ),
                    {
                      ...serverComment,
                      createdAt: new Date(serverComment.createdAt),
                    },
                  ],
                }
              : t
          )
        );
      })
      .catch(() => {});
  };

  const updateTaskComment = (
    taskId: number,
    commentId: string,
    text: string
  ) => {
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
    api(`/api/tasks/${taskId}/comments`, {
      method: "PUT",
      body: JSON.stringify({ commentId, text }),
    }).catch(() => {});
  };

  const deleteTaskComment = (taskId: number, commentId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: (t.comments || []).filter((c) => c.id !== commentId) }
          : t
      )
    );
    api<void>(`/api/tasks/${taskId}/comments?commentId=${commentId}`, {
      method: "DELETE",
    }).catch(() => {});
  };

  // -------------------- PROVIDER VALUE --------------------

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
      deleteTaskComment,
    }),
    [projects, tasks, selectedProjectId]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
