"use client";

import React, { useMemo, useState, useEffect, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { useProjects } from '../../contexts/ProjectsContext';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { TaskCard } from '../../components/todo';
import styles from './dashboard.module.scss';

const CreateTaskModal = dynamic(() => import('../../components/todo').then(mod => ({ default: mod.CreateTaskModal })), {
  loading: () => null,
  ssr: false,
});

const TaskEditModal = dynamic(() => import('../../components/todo').then(mod => ({ default: mod.TaskEditModal })), {
  loading: () => null,
  ssr: false,
});

const TaskDrawer = dynamic(() => import('../../components/todo').then(mod => ({ default: mod.TaskDrawer })), {
  loading: () => null,
  ssr: false,
});

function DashboardPageContent() {
  // Board state combines project context data with local UI state for modals, drawers, and menus.
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    projects,
    tasks,
    isLoading: projectsLoading,
    selectedProjectId,
    createProject,
    moveTaskStatus,
    updateTask,
    deleteTask,
    isTaskPending,
    getTaskPendingOperation,
  } = useProjects();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [drawerTaskId, setDrawerTaskId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close task action menus when focus moves outside the dropdown area.
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const taskToEdit = editingTaskId ? tasks.find((t) => t.id === editingTaskId) : null;

  // Keep edit and detail overlays in sync when a task is deleted or moved out from under the page.
  useEffect(() => {
    if (editingTaskId && !taskToEdit) {
      setEditingTaskId(null);
    }
  }, [editingTaskId, taskToEdit]);

  useEffect(() => {
    if (drawerTaskId && !tasks.find((t) => t.id === drawerTaskId)) {
      setDrawerTaskId(null);
    }
  }, [drawerTaskId, tasks]);

  // Command palette and URL query hooks can open the create-task flow from outside this page.
  useEffect(() => {
    const handler = () => setIsCreateOpen(true);
    window.addEventListener('command-palette:new-task', handler);
    return () => window.removeEventListener('command-palette:new-task', handler);
  }, []);

  useEffect(() => {
    if (searchParams.get('openCreate') === '1') {
      setIsCreateOpen(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('openCreate');
      router.replace(url.pathname + (url.search || ''), { scroll: false });
    }
  }, [searchParams, router]);

  // Task mutations delegate optimistic updates and rollback behavior to ProjectsContext.
  const handleDropdownToggle = (taskId) => {
    setOpenDropdown(openDropdown === taskId ? null : taskId);
  };

  const handleMoveToProject = async (taskId, newProjectId) => {
    setOpenDropdown(null);
    try {
      await updateTask(taskId, { projectId: newProjectId });
    } catch {
      // optimistic revert handled in context
    }
  };

  const handleDeleteTask = async (taskId) => {
    setOpenDropdown(null);
    if (drawerTaskId === taskId) setDrawerTaskId(null);
    try {
      await deleteTask(taskId);
    } catch {
      // optimistic revert handled in context
    }
  };

  const handleMoveStatus = async (taskId, status) => {
    try {
      await moveTaskStatus(taskId, status);
    } catch {
      // optimistic revert handled in context
    }
  };

  // Only show tasks for the active project; columns below group this list by status.
  const projectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const columns = [
    { key: 'todo', title: 'To Do', color: '#e74c3c' },
    { key: 'in-progress', title: 'In Progress', color: '#f39c12' },
    { key: 'done', title: 'Done', color: '#27ae60' },
  ];

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Initial and empty-project states keep the board from rendering incomplete project data.
  if (projectsLoading && projects.length === 0) {
    return <DashboardSkeleton />;
  }

  if (!selectedProject) {
    return (
      <div className={styles.dashboardPage}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1>Dashboard</h1>
            <p>Select a project to get started</p>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.addProjectBtn} onClick={() => createProject({ name: 'New Project' })}>
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create Project
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardPage}>
      {/* Board header: current project context and primary create-task action. */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>{selectedProject.name}</h1>
          <p>Manage your tasks and track progress</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.addProjectBtn} onClick={() => setIsCreateOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Task
          </button>
        </div>
      </div>

      {/* Kanban board: each column accepts dropped task cards and updates task status. */}
      <div className={styles.boardWrapper}>
        {columns.map((col) => (
          <div
            key={col.key}
            className={styles.boardColumn}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              let taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
              if (!taskId) {
                taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
              }
              if (taskId) {
                handleMoveStatus(taskId, col.key);
              }
            }}
          >
            <div className={styles.columnHeader}>
              <div className={styles.title}>{col.title}</div>
              {col.key === 'todo' && (
                <button className={styles.addTaskBtn} onClick={() => setIsCreateOpen(true)}>
                  + Add Task
                </button>
              )}
            </div>
            <div
              className={styles.cards}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.add(styles.dragOver);
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove(styles.dragOver);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove(styles.dragOver);
                let taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
                if (!taskId) {
                  taskId = parseInt(e.dataTransfer.getData('text/plain'), 10);
                }
                if (taskId) {
                  handleMoveStatus(taskId, col.key);
                }
              }}
              role="region"
              aria-label={`${col.title} column - drop tasks here`}
              data-column={col.key}
            >
              {/* Task cards expose detail, edit, delete, move-project, drag, and pending states. */}
              {projectTasks
                .filter((t) => t.status === col.key)
                .map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    projects={projects}
                    showStatus
                    showDropdown
                    openDropdown={openDropdown === t.id}
                    onDropdownToggle={handleDropdownToggle}
                    onOpen={(id) => setDrawerTaskId(id)}
                    onViewDetails={(id) => {
                      setOpenDropdown(null);
                      setDrawerTaskId(id);
                    }}
                    onEdit={(id) => {
                      setOpenDropdown(null);
                      setEditingTaskId(id);
                    }}
                    onDelete={handleDeleteTask}
                    onMoveToProject={handleMoveToProject}
                    draggable
                    isPending={isTaskPending(t.id)}
                    pendingOperation={getTaskPendingOperation(t.id)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('taskId', String(t.id));
                      e.dataTransfer.setData('text/plain', String(t.id));
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.dropEffect = 'move';
                      e.currentTarget.classList.add(styles.dragging);
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove(styles.dragging);
                    }}
                    className={styles.kanbanTaskCard}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail drawer keeps quick task review separate from full edit mode. */}
      <TaskDrawer
        taskId={drawerTaskId}
        isOpen={!!drawerTaskId}
        onClose={() => setDrawerTaskId(null)}
        onEdit={(id) => {
          setDrawerTaskId(null);
          setEditingTaskId(id);
        }}
      />

      {/* Create and edit modals own their forms while this page chooses the active project/status. */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={selectedProjectId}
        defaultStatus="todo"
      />

      {taskToEdit && (
        <TaskEditModal
          isOpen={!!editingTaskId}
          onClose={() => setEditingTaskId(null)}
          task={taskToEdit}
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    // Suspense is required because this route reads search params on the client.
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}
