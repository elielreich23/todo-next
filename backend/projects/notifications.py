"""
Helper functions for creating notifications
"""

from accounts.models import User

from .models import Notification


def _actor_name(user):
    return user.full_name or user.username or user.email


def notify_task_assignees(task, assignee_ids, actor):
    """Send notifications to all newly assigned users"""
    if not assignee_ids:
        return

    assignees = User.objects.filter(id__in=assignee_ids)
    actor_id = actor.id if actor else None

    for assignee in assignees:
        if assignee.id in {task.owner_id, actor_id}:
            continue
        Notification.objects.create(
            recipient=assignee,
            notification_type="task_assigned",
            title="Task Assigned",
            message=f'{_actor_name(actor) if actor else "A teammate"} assigned you to "{task.title}" in "{task.project.name}".',
            task=task,
            project=task.project,
        )


def create_task_update_notifications(task, actor):
    """Notify collaborators when a task is updated."""
    actor_id = actor.id if actor else None
    recipients = set(task.assignees.values_list("id", flat=True))
    recipients.add(task.owner_id)
    if task.project.owner_id:
        recipients.add(task.project.owner_id)

    recipients.discard(actor_id)

    if not recipients:
        return

    users = User.objects.filter(id__in=recipients)
    for user in users:
        Notification.objects.create(
            recipient=user,
            notification_type="task_updated",
            title="Task Updated",
            message=f'{_actor_name(actor) if actor else "A teammate"} updated "{task.title}" in "{task.project.name}".',
            task=task,
            project=task.project,
        )


def create_task_completed_notifications(task, actor):
    """Notify collaborators when a task is completed."""
    actor_id = actor.id if actor else None
    recipients = set(task.assignees.values_list("id", flat=True))
    recipients.add(task.owner_id)
    if task.project.owner_id:
        recipients.add(task.project.owner_id)

    recipients.discard(actor_id)

    if not recipients:
        return

    users = User.objects.filter(id__in=recipients)
    for user in users:
        Notification.objects.create(
            recipient=user,
            notification_type="task_completed",
            title="Task Completed",
            message=f'{_actor_name(actor) if actor else "A teammate"} marked "{task.title}" as completed.',
            task=task,
            project=task.project,
        )


def notify_project_assignees(project, assignee_ids, actor):
    """Notify users when they are added to a project."""
    if not assignee_ids:
        return

    assignees = User.objects.filter(id__in=assignee_ids)
    actor_id = actor.id if actor else None

    for assignee in assignees:
        if assignee.id == actor_id:
            continue
        Notification.objects.create(
            recipient=assignee,
            notification_type="project_shared",
            title="Project Shared",
            message=f'{_actor_name(actor) if actor else "A teammate"} added you to project "{project.name}".',
            project=project,
        )
