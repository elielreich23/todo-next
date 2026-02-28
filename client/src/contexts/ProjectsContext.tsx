"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from "react";
import { api } from "../lib/api";
import { useUser } from "./UserContext";
import { CUSTOM_EVENTS } from "../constants";

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

// -------------------- HELPER FUNCTIONS --------------------

/**
 * Maps assignees (user objects) to contributors (string array)
 */
const mapAssigneesToContributors = (assignees: any[] | undefined): string[] => {
  if (!Array.isArray(assignees) || assignees.length === 0) {
    return [];
  }

  return assignees.map((assignee: any) => {
    if (typeof assignee === 'string') {
      return assignee;
    }
    return assignee.full_name || assignee.username || assignee.email || String(assignee.id);
  });
};

/**
 * Extracts contributor IDs from contributors array
 */
const extractContributorIds = (contributors: any[]): number[] => {
  if (!Array.isArray(contributors) || contributors.length === 0) {
    return [];
  }

  return contributors
    .filter((contributor): contributor is { id: number } =>
      typeof contributor === 'object' &&
      contributor !== null &&
      'id' in contributor &&
      typeof contributor.id === 'number'
    )
    .map((contributor) => contributor.id);
};

/**
 * Maps server status to client status
 */
const mapServerToClientStatus = (status?: string): Task["status"] => {
  if (status === "in_progress") return "in-progress";
  if (status === "completed") return "done";
  return (status as Task["status"]) || "todo";
};

/**
 * Maps client status to server status
 */
const mapClientToServerStatus = (status?: Task["status"]): string | undefined => {
  if (!status) return undefined;
  if (status === "in-progress") return "in_progress";
  if (status === "done") return "completed";
  return status;
};

/**
 * Normalizes due date for server (converts YYYY-MM-DD to ISO format)
 */
const normalizeDueDateForServer = (dueDate?: string): string | undefined => {
  if (!dueDate) return undefined;
  if (dueDate.includes("T")) return dueDate;
  return `${dueDate}T00:00:00Z`;
};

/**
 * Normalizes server project to client Project shape
 */
const normalizeProject = (serverProject: any): Project => {
  const contributors = serverProject.assignees
    ? mapAssigneesToContributors(serverProject.assignees)
    : serverProject.contributors
    ? mapAssigneesToContributors(serverProject.contributors)
    : [];

  return {
    id: serverProject.id,
    name: serverProject.name,
    description: serverProject.description,
    color: serverProject.color || "#6366f1",
    category: serverProject.category,
    contributors,
    duration: serverProject.duration,
  };
};

/**
 * Normalizes server task to client Task shape
 */
const normalizeTask = (serverTask: any): Task => {
  const contributors = serverTask.assignees
    ? mapAssigneesToContributors(serverTask.assignees)
    : serverTask.contributors
    ? mapAssigneesToContributors(serverTask.contributors)
    : [];

  return {
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
    contributors,
    duration: serverTask.duration,
    notes: serverTask.notes,
  };
};

// -------------------- PROVIDER --------------------

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  // Listen for logout events to clear data
  useEffect(() => {
    const handleLogout = () => {
      setSelectedProjectId(null);
    };

    window.addEventListener(CUSTOM_EVENTS.USER_LOGOUT, handleLogout);
    return () => window.removeEventListener(CUSTOM_EVENTS.USER_LOGOUT, handleLogout);
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

        const response = await api<{ success: boolean; projects: any[] }>(
          "/api/projects/"
        );

        // Check if component unmounted or user changed
        if (isCancelled) return;

        console.log('Projects API response:', response);

        if (response.success) {
          console.log('Loaded projects:', response.projects);
          const normalizedProjects = response.projects.map(normalizeProject);
          setProjects(normalizedProjects);
          const initialProjectId = normalizedProjects[0]?.id ?? null;
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

  //const selectProject = (id: number | null) => setSelectedProjectId(id);

  // -------------------- ACTIONS --------------------

  const selectProject = useCallback((id: number | null) => {
    setSelectedProjectId(id);
  }, []);

  /**
   * Creates a project with optimistic update
   */
  const createProject = useCallback((data: Partial<Project>): Project => {
    const assigneeIds = Array.isArray(data.contributors)
      ? extractContributorIds(data.contributors)
      : [];

    const payload = {
      name: data.name,
      description: data.description,
      color: data.color || "#6366f1",
      assignee_ids: assigneeIds,
    };

    const contributorsStrings = Array.isArray(data.contributors)
      ? mapAssigneesToContributors(data.contributors)
      : [];

    const tempProject: Project = {
      id: Date.now(),
      name: payload.name || "Untitled project",
      description: payload.description,
      color: payload.color,
      contributors: contributorsStrings,
    };

    setProjects((prev) => [tempProject, ...prev]);
    setSelectedProjectId(tempProject.id);

    api<{ success: boolean; project: any }>("/api/projects/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.success) {
          const normalizedProject = normalizeProject(response.project);
          setProjects((prev) => [
            normalizedProject,
            ...prev.filter((p) => p.id !== tempProject.id),
          ]);
          setSelectedProjectId(normalizedProject.id);
        }
      })
      .catch(() => {
        // Keep optimistic project on error
      });

    return tempProject;
  }, []);

  /**
   * Creates a project and waits for server response
   */
  const createProjectAndWait = useCallback(async (data: Partial<Project>): Promise<Project> => {
    const assigneeIds = Array.isArray(data.contributors)
      ? extractContributorIds(data.contributors)
      : [];

    try {
      const response = await api<{ success: boolean; project: any }>("/api/projects/", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          color: data.color || "#6366f1",
          assignee_ids: assigneeIds,
        }),
      });

      if (response.success) {
        const normalizedProject = normalizeProject(response.project);
        setProjects((prev) => [normalizedProject, ...prev]);
        setSelectedProjectId(normalizedProject.id);
        return normalizedProject;
      }

      return createProject(data);
    } catch {
      return createProject(data);
    }
  }, [createProject]);

  /**
   * Updates a project
   */
  const updateProject = useCallback((id: number, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

    const assigneeIds = updates.contributors !== undefined
      ? Array.isArray(updates.contributors)
        ? extractContributorIds(updates.contributors)
        : []
      : undefined;

    const payload: any = { ...updates };
    if (assigneeIds !== undefined) {
      payload.assignee_ids = assigneeIds;
      delete payload.contributors;
    }

    api<{ success: boolean; project: any }>(`/api/projects/${id}/`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.success) {
          const normalizedProject = normalizeProject(response.project);
          setProjects((prev) =>
            prev.map((p) => (p.id === id ? normalizedProject : p))
          );
        }
      })
      .catch(() => {});
  }, []);

  /**
   * Creates a task with optimistic update
   */
  const createTask = useCallback((projectId: number, data: Partial<Task>): Task => {
    const OPTIMISTIC_ID_THRESHOLD = 1000000;
    const isRealProject = projects.some(
      (p) => p.id === projectId && p.id < OPTIMISTIC_ID_THRESHOLD
    );

    const createOptimisticTask = (): Task => {
      const tempTask: Task = {
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
      setTasks((prev) => [tempTask, ...prev]);
      return tempTask;
    };

    if (!isRealProject) {
      console.warn('Attempting to create task with optimistic project ID:', projectId);
      return createOptimisticTask();
    }

    const assigneeIds = Array.isArray(data.contributors)
      ? extractContributorIds(data.contributors)
      : [];

    const payload = {
      project: projectId,
      title: data.title || "New Task",
      description: data.description,
      status: mapClientToServerStatus(data.status) || "todo",
      due_date: normalizeDueDateForServer(data.dueDate),
      assignee_ids: assigneeIds,
    };

    const tempTask = createOptimisticTask();

    api<{ success: boolean; task: Task }>("/api/tasks/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (response.success) {
          setTasks((prev) => [
            normalizeTask(response.task),
            ...prev.filter((t) => t.id !== tempTask.id),
          ]);
        }
      })
      .catch((error) => {
        console.error('Task creation failed:', error);
      });

    return tempTask;
  }, [projects]);

  /**
   * Updates a task
   */
  const updateTask = useCallback((id: number, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }).catch(() => {});
  }, []);

  /**
   * Moves a task to a different status
   */
  const moveTaskStatus = useCallback((id: number, status: Task["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );

    const serverStatus = mapClientToServerStatus(status);
    api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
      method: "PUT",
      body: JSON.stringify({ status: serverStatus }),
    }).catch(() => {});
  }, []);

  /**
   * Deletes a project
   */
  const deleteProject = useCallback((id: number) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    setSelectedProjectId((prev) => (prev === id ? null : prev));
    api<void>(`/api/projects/${id}/`, { method: "DELETE" }).catch(() => {});
  }, []);

  /**
   * Deletes a task
   */
  const deleteTask = useCallback((id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    api<void>(`/api/tasks/${id}/`, { method: "DELETE" }).catch(() => {});
  }, []);

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
    api(`/api/tasks/${taskId}/comments/${commentId}/`, {
      method: "PUT",
      body: JSON.stringify({ text }),
    }).catch(() => {
      // Reload comments on failure to stay consistent
      loadTaskDetails(taskId).then((details) => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, comments: details.comments } : t
          )
        );
      });
    });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, tasks, selectedProjectId]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
