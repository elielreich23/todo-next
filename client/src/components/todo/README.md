# Todo Components

This directory contains reusable components for managing tasks in the todo application.

## Components

### CreateTaskModal
A wizard-style modal for creating new tasks with multiple steps including:
- Basic information (title, project, category, contributors)
- Task details (description, duration)
- Progress & timeline (progress steps, due date, status)
- Additional notes
- File attachments (drag & drop support)
- Initial comments

**Usage:**
```jsx
import { CreateTaskModal } from '../../components/todo';

<CreateTaskModal
  isOpen={isCreateOpen}
  onClose={() => setIsCreateOpen(false)}
  projectId={selectedProjectId}
  defaultStatus="todo"
/>
```

### TaskEditModal
A wizard-style modal for editing existing tasks. Pre-populates all fields with current task data and allows users to modify any aspect of the task.

**Usage:**
```jsx
import { TaskEditModal } from '../../components/todo';

<TaskEditModal
  isOpen={!!editingTaskId}
  onClose={() => setEditingTaskId(null)}
  task={tasks.find(t => t.id === editingTaskId)}
  projectId={selectedProjectId}
/>
```

### TaskCard
A reusable card component for displaying task information. Can be clicked to edit and includes a dropdown menu for additional actions.

**Usage:**
```jsx
import { TaskCard } from '../../components/todo';

<TaskCard
  task={task}
  onEdit={(taskId) => setEditingTaskId(taskId)}
  onDelete={(taskId) => deleteTask(taskId)}
  onMoveToProject={(taskId, projectId) => moveTask(taskId, projectId)}
  projects={projects}
  showDropdown={true}
  draggable={true}
  onDragStart={(e) => e.dataTransfer.setData('taskId', String(task.id))}
/>
```

## Features

- **Click to Edit**: Users can click on any task card to open the edit modal
- **Wizard Interface**: Both create and edit modals use a step-by-step wizard interface
- **File Management**: Support for file attachments with drag & drop
- **Comments System**: Built-in commenting system for tasks
- **Responsive Design**: Works on both desktop and mobile devices
- **Dark Mode Support**: Includes dark mode styling
- **Reusable**: Components can be used throughout the application

## Integration

These components are already integrated into:
- Dashboard page (`/dashboard`)
- Project detail pages (`/dashboard/projects/[id]`)

To use in other parts of the application, simply import the components and follow the usage examples above.

## Styling

Components use CSS modules for styling:
- `CreateTaskModal` and `TaskEditModal` use `wizardModal.module.css`
- `TaskCard` uses `TaskCard.module.css`

All components support both light and dark themes.
