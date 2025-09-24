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
import { useUser } from "./UserContext";

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
  createProjectAndWait: (data: Partial<Project>) => Promise<Project>;
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
  const { user, isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );

  // Normalize server task to client Task shape
  const normalizeTask = (serverTask: any): Task => {
    const mapServerToClientStatus = (s?: string): Task["status"] => {
      if (s === "in_progress") return "in-progress";
      if (s === "completed") return "done";
      return (s as Task["status"]) || "todo";
    };
    const normalized = {
      id: serverTask.id,
      projectId: Number(serverTask.project ?? serverTask.projectId),
      title: serverTask.title,
      dueDate: serverTask.due_date ?? serverTask.dueDate,
      status: mapServerToClientStatus(serverTask.status),
      description: serverTask.description,
      project: serverTask.project_name ?? serverTask.project ?? undefined,
      progress: serverTask.progress ?? 0,
      totalSteps: serverTask.totalSteps ?? 0,
      attachments: serverTask.attachments ?? [],
      comments: serverTask.comments ?? [],
      category: serverTask.category,
      contributors: serverTask.contributors,
      duration: serverTask.duration,
      notes: serverTask.notes,
    } as Task;
    console.log('Normalized task:', normalized);
    return normalized;
  };

  const mapClientToServerStatus = (s?: Task["status"]): string | undefined => {
    if (!s) return undefined;
    if (s === "in-progress") return "in_progress";
    if (s === "done") return "completed";
    return s;
  };

  const normalizeDueDateForServer = (d?: string): string | undefined => {
    if (!d) return undefined;
    // If already ISO-like, pass through
    if (d.includes("T")) return d;
    // Convert YYYY-MM-DD to ISO start of day UTC
    return `${d}T00:00:00Z`;
  };

  // Listen for logout events to clear data
  useEffect(() => {
    const handleLogout = () => {
      // Don't clear projects and tasks on logout - they should persist
      // Only clear the selected project
      setSelectedProjectId(null);
    };

    window.addEventListener('userLogout', handleLogout);
    return () => window.removeEventListener('userLogout', handleLogout);
  }, []);

  // Load projects and tasks when user changes
  useEffect(() => {
    // Wait for user context to finish loading
    if (userLoading) {
      console.log('User context still loading...');
      return;
    }

    if (!user) {
      // Clear data when no user
      console.log('No user, clearing data');
      setProjects([]);
      setTasks([]);
      setSelectedProjectId(null);
      return;
    }

    (async () => {
      try {
        console.log('Loading projects for user:', user.username);
        console.log('Access token:', localStorage.getItem('access_token'));
        
        const response = await api<{ success: boolean; projects: Project[] }>(
          "/api/projects/"
        );
        console.log('Projects API response:', response);
        
        if (response.success) {
          console.log('Loaded projects:', response.projects);
          setProjects(response.projects);
          const initialProjectId = response.projects[0]?.id ?? null;
          setSelectedProjectId(initialProjectId);
          if (initialProjectId) {
            const tasksResponse = await api<{
              success: boolean;
              tasks: Task[];
            }>(`/api/tasks/?projectId=${initialProjectId}`);
            console.log('Tasks API response:', tasksResponse);
            if (tasksResponse.success) {
              console.log('Loaded tasks:', tasksResponse.tasks);
              setTasks(tasksResponse.tasks.map((t) => normalizeTask(t)));
            }
          }
        } else {
          console.error('Projects API returned success: false');
        }
      } catch (error) {
        console.error("Failed to load projects:", error);
      }
    })();
  }, [user, userLoading]);

  // When selected project changes, load its tasks
  useEffect(() => {
    if (!selectedProjectId) {
      setTasks([]);
      return;
    }
    (async () => {
      try {
        const response = await api<{ success: boolean; tasks: Task[] }>(
          `/api/tasks/?projectId=${selectedProjectId}`
        );
        if (response.success) {
          setTasks(response.tasks.map((t) => normalizeTask(t)));
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
    // Immediately select the newly created project for better UX
    setSelectedProjectId(temp.id);

    api<{ success: boolean; project: Project }>("/api/projects/", {
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
        // Keep the optimistic project even if the server request fails
        // Optionally, you could set a flag here to indicate unsynced state
      });

    return temp;
  };

  const createProjectAndWait = async (data: Partial<Project>): Promise<Project> => {
    try {
      const response = await api<{ success: boolean; project: Project }>("/api/projects/", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color || "#6366f1",
        }),
      });
      if (response.success) {
        const serverProject = response.project;
        setProjects((prev) => [serverProject, ...prev]);
        setSelectedProjectId(serverProject.id);
        return serverProject;
      }
      // Fallback to optimistic create if server did not return success
      return createProject(data);
    } catch {
      // Fallback to optimistic create on error
      return createProject(data);
    }
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
    // Check if this is a real project ID (not optimistic)
    const isRealProject = projects.some(p => p.id === projectId && p.id < 1000000); // Real IDs are usually smaller
    
    if (!isRealProject) {
      console.warn('Attempting to create task with optimistic project ID:', projectId);
      // Don't create the task on server yet, just return optimistic
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
      return temp;
    }

    const payload = {
      project: projectId,
      title: data.title || "New Task",
      description: data.description,
      status: mapClientToServerStatus(data.status) || "todo",
      due_date: normalizeDueDateForServer(data.dueDate),
    };
    console.log('Creating task with payload:', payload);
    console.log('Current projects:', projects.map(p => ({ id: p.id, name: p.name })));

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
          console.log('Task creation response:', response.task);
          setTasks((prev) => [
            normalizeTask(response.task),
            ...prev.filter((t) => t.id !== temp.id),
          ]);
        }
      })
      .catch((error) => {
        console.error('Task creation failed:', error);
        // Keep the optimistic task even if server creation fails
        // setTasks((prev) => prev.filter((t) => t.id !== temp.id));
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
    const serverStatus = mapClientToServerStatus(status);
    api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify({ status: serverStatus }),
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
      createProjectAndWait,
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
