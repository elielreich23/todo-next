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

    // Check if we have an access token before making API calls
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!accessToken) {
      console.log('No access token, skipping API call');
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        console.log('Loading projects for user:', user.username);
        console.log('Access token exists:', !!accessToken);
        
        const response = await api<{ success: boolean; projects: Project[] }>(
          "/api/projects/"
        );
        
        // Check if component unmounted or user changed
        if (isCancelled) return;
        
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
            
            // Check again if cancelled
            if (isCancelled) return;
            
            console.log('Tasks API response:', tasksResponse);
            if (tasksResponse.success) {
              console.log('Loaded tasks:', tasksResponse.tasks);
              const normalizedTasks = await Promise.all(
                tasksResponse.tasks.map(async (t) => {
                  const normalized = normalizeTask(t);
                  const details = await loadTaskDetails(t.id);
                  return {
                    ...normalized,
                    comments: details.comments,
                    attachments: details.attachments,
                  };
                })
              );
              if (!isCancelled) {
                setTasks(normalizedTasks);
              }
            }
          }
        } else {
          console.error('Projects API returned success: false');
        }
      } catch (error: any) {
        // Don't log errors if we're being redirected to login
        if (error?.message?.includes('Not authenticated') || error?.message?.includes('Please log in')) {
          console.log('Authentication required, redirecting...');
          return;
        }
        console.error("Failed to load projects:", error);
      }
    })();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isCancelled = true;
    };
  }, [user, userLoading]);

  // Load comments and attachments for tasks
  const loadTaskDetails = async (taskId: number) => {
    try {
      // Load comments
      const commentsResponse = await api<{ success: boolean; comments: any[] }>(
        `/api/tasks/${taskId}/comments/`
      );
      
      // Load attachments
      const attachmentsResponse = await api<{ success: boolean; attachments: any[] }>(
        `/api/tasks/${taskId}/attachments/`
      );
      
      return {
        comments: commentsResponse.success ? commentsResponse.comments.map((c: any) => ({
          id: c.id.toString(),
          text: c.text,
          author: c.author?.full_name || c.author?.username || 'Unknown',
          createdAt: new Date(c.created_at),
          updatedAt: c.updated_at ? new Date(c.updated_at) : undefined,
        })) : [],
        attachments: attachmentsResponse.success ? attachmentsResponse.attachments.map((a: any) => ({
          id: a.id.toString(),
          name: a.name,
          size: a.file_size,
          type: a.file_type,
          url: a.file_url,
          uploadedAt: new Date(a.created_at),
          uploadedBy: a.uploaded_by?.full_name || a.uploaded_by?.username || 'Unknown',
        })) : [],
      };
    } catch (error) {
      console.error(`Failed to load details for task ${taskId}:`, error);
      return { comments: [], attachments: [] };
    }
  };

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
          const normalizedTasks = await Promise.all(
            response.tasks.map(async (t) => {
              const normalized = normalizeTask(t);
              const details = await loadTaskDetails(t.id);
              return {
                ...normalized,
                comments: details.comments,
                attachments: details.attachments,
              };
            })
          );
          setTasks(normalizedTasks);
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

    // Extract assignee IDs from contributors if provided
    let assignee_ids = [];
    if (data.contributors && Array.isArray(data.contributors)) {
      // If contributors are user objects with IDs, extract IDs
      if (data.contributors.length > 0 && typeof data.contributors[0] === 'object' && data.contributors[0].id) {
        assignee_ids = data.contributors.map(c => c.id);
      }
    }

    const payload = {
      project: projectId,
      title: data.title || "New Task",
      description: data.description,
      status: mapClientToServerStatus(data.status) || "todo",
      due_date: normalizeDueDateForServer(data.dueDate),
      assignee_ids: assignee_ids,
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

  const addTaskAttachment = async (taskId: number, file: File, uploadedBy: string) => {
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/tasks/${taskId}/attachments/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.success && data.attachment) {
        const attachment: FileAttachment = {
          id: data.attachment.id.toString(),
          name: data.attachment.name,
          size: data.attachment.file_size,
          type: data.attachment.file_type,
          url: data.attachment.file_url,
          uploadedAt: new Date(data.attachment.created_at),
          uploadedBy: data.attachment.uploaded_by?.full_name || data.attachment.uploaded_by?.username || uploadedBy,
        };

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, attachments: [...(t.attachments || []), attachment] }
              : t
          )
        );
      } else {
        throw new Error(data.message || 'Failed to upload attachment');
      }
    } catch (error) {
      console.error('Failed to upload attachment:', error);
      throw error;
    }
  };

  const removeTaskAttachment = async (taskId: number, attachmentId: string) => {
    try {
      const response = await api<{ success: boolean }>(
        `/api/tasks/${taskId}/attachments/${attachmentId}/`,
        { method: 'DELETE' }
      );

      if (response.success) {
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
      }
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const addTaskComment = async (taskId: number, text: string, author: string) => {
    const tempComment: TaskComment = {
      id: Date.now().toString(),
      text,
      author,
      createdAt: new Date(),
    };

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: [...(t.comments || []), tempComment] }
          : t
      )
    );

    try {
      const response = await api<{ success: boolean; comment: any }>(
        `/api/tasks/${taskId}/comments/`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        }
      );

      if (response.success && response.comment) {
        const serverComment: TaskComment = {
          id: response.comment.id.toString(),
          text: response.comment.text,
          author: response.comment.author?.full_name || response.comment.author?.username || author,
          createdAt: new Date(response.comment.created_at),
          updatedAt: response.comment.updated_at ? new Date(response.comment.updated_at) : undefined,
        };

        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  comments: [
                    ...(t.comments || []).filter(
                      (c) => c.id !== tempComment.id
                    ),
                    serverComment,
                  ],
                }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      // Revert optimistic update on error
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                comments: (t.comments || []).filter(
                  (c) => c.id !== tempComment.id
                ),
              }
            : t
        )
      );
    }
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

  const deleteTaskComment = async (taskId: number, commentId: string) => {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, comments: (t.comments || []).filter((c) => c.id !== commentId) }
          : t
      )
    );

    try {
      await api<{ success: boolean }>(
        `/api/tasks/${taskId}/comments/${commentId}/`,
        { method: "DELETE" }
      );
    } catch (error) {
      console.error('Failed to delete comment:', error);
      // Reload comments on error to revert
      const details = await loadTaskDetails(taskId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, comments: details.comments } : t
        )
      );
    }
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
