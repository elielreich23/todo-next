"""
Helper functions for creating notifications
"""
from .models import Notification, Task, Project
from accounts.models import User


def create_task_assignment_notification(task, assignee):
    """Create a notification when a user is assigned to a task"""
    owner_name = task.owner.full_name or task.owner.username or task.owner.email
    
    Notification.objects.create(
        recipient=assignee,
        notification_type='task_assigned',
        title='Task Assigned',
        message=f'{owner_name} has assigned you to the task "{task.title}" (ID: {task.id}) in project "{task.project.name}".',
        task=task,
        project=task.project
    )


def notify_task_assignees(task, assignee_ids):
    """Send notifications to all newly assigned users"""
    if not assignee_ids:
        return
    
    from accounts.models import User
    assignees = User.objects.filter(id__in=assignee_ids)
    
    for assignee in assignees:
        # Only send notification if user is not the task owner
        if assignee.id != task.owner.id:
            create_task_assignment_notification(task, assignee)

