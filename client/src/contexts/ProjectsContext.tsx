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
import { API_BASE_URL } from "../constants";
import { useUser } from "./UserContext";
import { CUSTOM_EVENTS } from "../constants";
import { getAccessToken } from "../utils/storage";

// -------------------- TYPES --------------------

export type Task = {
  id: number;
  projectId: number;
  title: string;
  dueDate?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "high" | "medium" | "low";
  description?: string;
  project?: string;
  progress?: number;
  totalSteps?: number;
  updatedAt?: Date;
  attachments?: FileAttachment[];
  comments?: TaskComment[];
  category?: string;
  contributors?: string[];
  assignees?: Array<{ id: number; full_name?: string; username?: string; email?: string }>;
  duration?: string;
  notes?: string;
};

export type TaskPendingOperation = "creating" | "updating" | "deleting" | "moving";

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
  isLoading: boolean;
  pendingTaskOperations: Record<number, TaskPendingOperation>;
  selectedProjectId: number | null;
  selectProject: (id: number | null) => void;
  createProject: (data: Partial<Project>) => Project;
  createProjectAndWait: (data: Partial<Project>) => Promise<Project>;
  updateProject: (id: number, updates: Partial<Project>) => void;
  createTask: (projectId: number, data: Partial<Task>) => Promise<Task>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  moveTaskStatus: (id: number, status: Task["status"]) => Promise<void>;
  deleteProject: (id: number) => void;
  deleteTask: (id: number) => Promise<void>;
  deleteTasksByStatus: (
    projectId: number,
    status: "all" | Task["status"]
  ) => void;
  getProjectTasks: (projectId: number) => Task[];
  isTaskPending: (taskId: number) => boolean;
  getTaskPendingOperation: (taskId: number) => TaskPendingOperation | undefined;
  addTaskAttachment: (taskId: number, file: File, uploadedBy: string) => void;
  removeTaskAttachment: (taskId: number, attachmentId: string) => void;
  addTaskComment: (taskId: number, text: string, author: string) => void;
  updateTaskComment: (
    taskId: number,
    commentId: string,
    text: string
  ) => void;
  deleteTaskComment: (taskId: number, commentId: string) => void;
  refreshTaskDetails: (taskId: number) => Promise<Task | null>;
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
 * Normalizes due date from server to YYYY-MM-DD for date inputs
 */
const formatDueDateForClient = (dueDate?: string): string | undefined => {
  if (!dueDate) return undefined;
  return dueDate.split("T")[0];
};

/**
 * Returns true for client-generated comment IDs (not yet saved to the API)
 */
const isLocalCommentId = (id: string | number): boolean => {
  if (typeof id === "number") {
    return !Number.isInteger(id);
  }
  return !/^\d+$/.test(String(id));
};

/**
 * Returns true for client-generated attachment IDs (not yet uploaded)
 */
const isLocalAttachment = (attachment: FileAttachment): boolean => {
  return Boolean((attachment as FileAttachment & { file?: File }).file);
};

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

const MAX_ATTACHMENT_SIZE_BYTES = 200 * 1024 * 1024;
const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

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
  const assigneeObjects = Array.isArray(serverTask.assignees) ? serverTask.assignees : [];
  const contributors = assigneeObjects.length
    ? mapAssigneesToContributors(assigneeObjects)
    : serverTask.contributors
    ? mapAssigneesToContributors(serverTask.contributors)
    : [];

  return {
    id: serverTask.id,
    projectId: Number(serverTask.project ?? serverTask.projectId),
    title: serverTask.title,
    dueDate: formatDueDateForClient(serverTask.due_date ?? serverTask.dueDate),
    status: mapServerToClientStatus(serverTask.status),
    priority: serverTask.priority || "medium",
    description: serverTask.description,
    project: serverTask.project_name ?? serverTask.project ?? undefined,
    progress: serverTask.progress ?? 0,
    totalSteps: serverTask.total_steps ?? serverTask.totalSteps ?? 0,
    updatedAt: serverTask.updated_at ? new Date(serverTask.updated_at) : undefined,
    attachments: serverTask.attachments ?? [],
    comments: serverTask.comments ?? [],
    category: serverTask.category,
    contributors,
    assignees: assigneeObjects.map((assignee: any) => ({
      id: assignee.id,
      full_name: assignee.full_name,
      username: assignee.username,
      email: assignee.email,
    })),
    duration: serverTask.duration,
    notes: serverTask.notes,
  };
};

const mergeTaskWithDetails = (
  normalized: Task,
  details: { comments: TaskComment[]; attachments: FileAttachment[] }
): Task => ({
  ...normalized,
  comments: details.comments,
  attachments: details.attachments,
});

// -------------------- PROVIDER --------------------

const mapTasksFromApi = (rawTasks: Task[]): Task[] =>
  rawTasks.map((t) => normalizeTask(t));

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: userLoading } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTaskOperations, setPendingTaskOperations] = useState<
    Record<number, TaskPendingOperation>
  >({});
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const setTaskPending = useCallback(
    (taskId: number, operation: TaskPendingOperation | null) => {
      setPendingTaskOperations((prev) => {
        if (!operation) {
          const next = { ...prev };
          delete next[taskId];
          return next;
        }
        return { ...prev, [taskId]: operation };
      });
    },
    []
  );

  const isTaskPending = useCallback(
    (taskId: number) => taskId in pendingTaskOperations,
    [pendingTaskOperations]
  );

  const getTaskPendingOperation = useCallback(
    (taskId: number) => pendingTaskOperations[taskId],
    [pendingTaskOperations]
  );

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
      return;
    }

    if (!user) {
      setProjects([]);
      setTasks([]);
      setSelectedProjectId(null);
      setIsLoading(false);
      return;
    }

    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const response = await api<{ success: boolean; projects: any[] }>(
          "/api/projects/"
        );

        if (isCancelled) return;

        if (response.success) {
          const normalizedProjects = response.projects.map(normalizeProject);
          setProjects(normalizedProjects);
          const initialProjectId = normalizedProjects[0]?.id ?? null;
          setSelectedProjectId(initialProjectId);
          if (!initialProjectId) {
            setTasks([]);
            setIsLoading(false);
          }
        } else if (!isCancelled) {
          setIsLoading(false);
        }
      } catch (error: any) {
        if (error?.message?.includes('Not authenticated') || error?.message?.includes('Please log in')) {
          return;
        }
        console.error("Failed to load projects:", error);
        if (!isCancelled) {
          setIsLoading(false);
        }
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

  const refreshTaskDetails = useCallback(async (taskId: number): Promise<Task | null> => {
    const [taskResponse, details] = await Promise.all([
      api<{ success: boolean; task: any }>(`/api/tasks/${taskId}/`, undefined, false).catch(() => null),
      loadTaskDetails(taskId),
    ]);
    let refreshedTask: Task | null = null;

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task;
        const normalizedTask = taskResponse?.success ? normalizeTask(taskResponse.task) : task;
        refreshedTask = mergeTaskWithDetails(normalizedTask, details);
        return refreshedTask;
      })
    );

    return refreshedTask;
  }, []);

  // When selected project changes, load its tasks
  useEffect(() => {
    if (!selectedProjectId || userLoading || !user) {
      if (!selectedProjectId) setTasks([]);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);

    (async () => {
      try {
        const response = await api<{ success: boolean; tasks: Task[] }>(
          `/api/tasks/?projectId=${selectedProjectId}`
        );
        if (!isCancelled && response.success) {
          setTasks(mapTasksFromApi(response.tasks));
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedProjectId, user, userLoading]);

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
  const createTask = useCallback(async (projectId: number, data: Partial<Task>): Promise<Task> => {
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
        priority: data.priority || "medium",
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
      setTaskPending(tempTask.id, "creating");
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
      priority: data.priority || "medium",
      due_date: normalizeDueDateForServer(data.dueDate),
      assignee_ids: assigneeIds,
      progress: data.progress,
      total_steps: data.totalSteps,
      category: data.category,
      duration: data.duration,
      notes: data.notes,
    };

    const tempTask = createOptimisticTask();

    try {
      const response = await api<{ success: boolean; task: Task }>("/api/tasks/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success) {
        const createdTask = response.task;

        // Upload comments
        if (data.comments && data.comments.length > 0) {
          for (const comment of data.comments) {
            try {
              await api(`/api/tasks/${createdTask.id}/comments/`, {
                method: 'POST',
                body: JSON.stringify({ text: comment.text })
              });
            } catch (e) { console.error('Failed to upload comment', e); }
          }
        }

        // Upload attachments
        if (data.attachments && data.attachments.length > 0) {
          for (const attachment of data.attachments) {
            if ((attachment as any).file) {
              try {
                const formData = new FormData();
                formData.append('file', (attachment as any).file);
                formData.append('name', attachment.name);
                await api(`/api/tasks/${createdTask.id}/attachments/`, {
                  method: 'POST',
                  body: formData as any
                });
              } catch (e) { console.error('Failed to upload attachment', e); }
            }
          }
        }

        setTasks((prev) => [
          ...prev.filter((t) => t.id !== tempTask.id),
          normalizeTask(createdTask),
        ]);
        setTaskPending(tempTask.id, null);

        const details = await loadTaskDetails(createdTask.id);
        const merged = mergeTaskWithDetails(normalizeTask(createdTask), details);
        setTasks((prev) =>
          prev.map((t) => (t.id === createdTask.id ? merged : t))
        );
        return merged;
      }

      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id));
      setTaskPending(tempTask.id, null);
      throw new Error('Failed to create task.');
    } catch (error) {
      console.error('Task creation failed:', error);
      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id));
      setTaskPending(tempTask.id, null);
      throw error;
    }
  }, [projects, setTaskPending]);

  /**
   * Updates a task
   */
  const updateTask = useCallback(async (id: number, updates: Partial<Task>): Promise<void> => {
    let previousTask: Task | undefined;
    setTasks((prev) => {
      previousTask = prev.find((t) => t.id === id);
      return prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
    });

    setTaskPending(id, "updating");

    // Build a clean payload with only fields the backend serializer accepts.
    // Never send frontend-only fields (contributors, project name string, etc.)
    // which would cause a 400 Bad Request.
    const serverPayload: Record<string, unknown> = {};

    if (updates.title !== undefined)       serverPayload.title       = updates.title;
    if (updates.description !== undefined) serverPayload.description = updates.description;
    if (updates.priority !== undefined)    serverPayload.priority    = updates.priority;
    if (updates.status !== undefined)      serverPayload.status      = mapClientToServerStatus(updates.status);
    if (updates.dueDate !== undefined)     serverPayload.due_date    = normalizeDueDateForServer(updates.dueDate);
    if (updates.projectId !== undefined)   serverPayload.project     = updates.projectId;
    if (updates.progress !== undefined)    serverPayload.progress    = updates.progress;
    if (updates.totalSteps !== undefined)  serverPayload.total_steps = updates.totalSteps;
    if (updates.category !== undefined)    serverPayload.category    = updates.category;
    if (updates.duration !== undefined)    serverPayload.duration    = updates.duration;
    if (updates.notes !== undefined)       serverPayload.notes       = updates.notes;

    // Map assignee user objects (or legacy contributor strings) to assignee_ids
    if (updates.contributors !== undefined) {
      serverPayload.assignee_ids = extractContributorIds(updates.contributors as any[]);
    } else if (updates.assignees !== undefined) {
      serverPayload.assignee_ids = updates.assignees.map((assignee) => assignee.id);
    }

    try {
      const response = await api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
        method: "PUT",
        body: JSON.stringify(serverPayload),
      });

      if (response.success) {
        if (updates.comments && updates.comments.length > 0) {
          const newComments = updates.comments.filter((comment) => isLocalCommentId(comment.id));
          for (const comment of newComments) {
            try {
              await api(`/api/tasks/${id}/comments/`, {
                method: 'POST',
                body: JSON.stringify({ text: comment.text })
              });
            } catch (e) { console.error('Failed to upload comment', e); }
          }
        }

        if (updates.attachments && updates.attachments.length > 0) {
          const newAttachments = updates.attachments.filter(isLocalAttachment);
          for (const attachment of newAttachments) {
            try {
              const formData = new FormData();
              formData.append('file', (attachment as FileAttachment & { file: File }).file);
              formData.append('name', attachment.name);
              await api(`/api/tasks/${id}/attachments/`, {
                method: 'POST',
                body: formData as any
              });
            } catch (e) { console.error('Failed to upload attachment', e); }
          }
        }

        const details = await loadTaskDetails(id);
        const merged = mergeTaskWithDetails(normalizeTask(response.task), details);
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? merged : t))
        );
      }
    } catch (error) {
      if (previousTask) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? previousTask! : t))
        );
      }
      throw error;
    } finally {
      setTaskPending(id, null);
    }
  }, [setTaskPending]);

  /**
   * Moves a task to a different status
   */
  const moveTaskStatus = useCallback(async (id: number, status: Task["status"]): Promise<void> => {
    let previousStatus: Task["status"] | undefined;
    setTasks((prev) => {
      previousStatus = prev.find((t) => t.id === id)?.status;
      return prev.map((t) => (t.id === id ? { ...t, status } : t));
    });

    setTaskPending(id, "moving");

    const serverStatus = mapClientToServerStatus(status);

    try {
      const response = await api<{ success: boolean; task: Task }>(`/api/tasks/${id}/`, {
        method: "PUT",
        body: JSON.stringify({ status: serverStatus }),
      });

      if (response.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? normalizeTask(response.task) : t))
        );
      }
    } catch (error) {
      if (previousStatus) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: previousStatus } : t))
        );
      }
      throw error;
    } finally {
      setTaskPending(id, null);
    }
  }, [setTaskPending]);

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
  const deleteTask = useCallback(async (id: number): Promise<void> => {
    let deletedTask: Task | undefined;
    setTasks((prev) => {
      deletedTask = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });

    setTaskPending(id, "deleting");

    try {
      await api<void>(`/api/tasks/${id}/`, { method: "DELETE" });
    } catch (error) {
      if (deletedTask) {
        setTasks((prev) => [deletedTask!, ...prev]);
      }
      throw error;
    } finally {
      setTaskPending(id, null);
    }
  }, [setTaskPending]);

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
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      throw new Error("File size exceeds 200 MB limit");
    }
    if (file.type && !ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.type)) {
      throw new Error("Unsupported file type");
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);

    try {
      const token = getAccessToken();
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/attachments/`, {
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
      isLoading,
      pendingTaskOperations,
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
      isTaskPending,
      getTaskPendingOperation,
      addTaskAttachment,
      removeTaskAttachment,
      addTaskComment,
      updateTaskComment,
      deleteTaskComment,
      refreshTaskDetails,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projects, tasks, isLoading, pendingTaskOperations, selectedProjectId]
  );

  return (
    <ProjectsContext.Provider value={value}>
      {children}
    </ProjectsContext.Provider>
  );
}
