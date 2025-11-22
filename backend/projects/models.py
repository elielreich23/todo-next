from django.conf import settings
from django.db import models


class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=7, default="#6366f1")  # Hex color
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="projects")
    # Users assigned to work on this project (can be multiple)
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="assigned_projects", blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
    ]

    STATUS_CHOICES = [
        ("todo", "To Do"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="todo")
    due_date = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="tasks")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    # Users assigned to work on this task (can be multiple)
    assignees = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="assigned_tasks", blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Automatically set completed_at when status changes to completed
        if self.status == "completed" and not self.completed_at:
            from django.utils import timezone

            self.completed_at = timezone.now()
        elif self.status != "completed":
            self.completed_at = None
        super().save(*args, **kwargs)


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ("task_assigned", "Task Assigned"),
        ("task_updated", "Task Updated"),
        ("task_completed", "Task Completed"),
        ("project_shared", "Project Shared"),
    ]

    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications")
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} - {self.recipient.email}"


class TaskComment(models.Model):
    """Comments on tasks"""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="task_comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="task_comments")
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.email} on task {self.task.id}"


class TaskAttachment(models.Model):
    """File attachments on tasks"""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="task_attachments")
    file = models.FileField(upload_to="task_attachments/%Y/%m/%d/")
    name = models.CharField(max_length=255)  # Original filename
    file_size = models.BigIntegerField()  # Size in bytes
    file_type = models.CharField(max_length=100, blank=True)  # MIME type
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="uploaded_attachments")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} - Task {self.task.id}"
