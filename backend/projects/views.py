from datetime import timedelta

from django.db.models import Count, Prefetch, Q
from django.http import FileResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .cache import (
    cache_project_detail,
    cache_project_list,
    cache_statistics,
    cache_task_detail,
    cache_task_list,
    get_cached_project_detail,
    get_cached_project_list,
    get_cached_statistics,
    get_cached_task_detail,
    get_cached_task_list,
    invalidate_project_cache,
    invalidate_task_cache,
)
from .models import CalendarEvent, Project, Task, TaskAttachment, TaskComment, UserUpload
from .notifications import (
    create_task_completed_notifications,
    create_task_update_notifications,
    notify_project_assignees,
    notify_task_assignees,
)
from .pagination import AttachmentPagination, CommentPagination, ProjectPagination, TaskPagination
from .serializers import (
    CalendarEventSerializer,
    ProjectCreateUpdateSerializer,
    ProjectSerializer,
    TaskAttachmentSerializer,
    TaskCommentSerializer,
    TaskCreateUpdateSerializer,
    TaskSerializer,
    UserUploadSerializer,
)


def _project_queryset_for_user(user):
    """Optimized queryset for projects with select_related and prefetch_related"""
    return (
        Project.objects.filter(Q(owner=user) | Q(assignees=user))
        .select_related("owner")
        .prefetch_related(
            "assignees",
            Prefetch("tasks", queryset=Task.objects.select_related("owner", "project").prefetch_related("assignees")),
        )
        .distinct()
    )


def _task_queryset_for_user(user):
    """Optimized queryset for tasks with select_related and prefetch_related"""
    return (
        Task.objects.filter(Q(owner=user) | Q(assignees=user) | Q(project__owner=user) | Q(project__assignees=user))
        .select_related("owner", "project", "project__owner")
        .prefetch_related(
            "assignees",
            Prefetch("task_comments", queryset=TaskComment.objects.select_related("author").order_by("-created_at")),
            Prefetch(
                "task_attachments", queryset=TaskAttachment.objects.select_related("uploaded_by").order_by("-created_at")
            ),
        )
        .distinct()
    )


def _get_project_or_404_for_user(pk, user):
    return _project_queryset_for_user(user).get(pk=pk)


def _get_task_or_404_for_user(pk, user):
    return _task_queryset_for_user(user).get(pk=pk)


# Project Views
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def project_list_create(request):
    """List all projects for the authenticated user or create a new project"""
    if request.method == "GET":
        # Try to get from cache first (only for first page, no filters)
        if not request.query_params.get("page"):
            cached_data = get_cached_project_list(request.user.id)
            if cached_data:
                return Response({"success": True, "projects": cached_data})

        paginator = ProjectPagination()
        projects = _project_queryset_for_user(request.user).order_by("-created_at")
        paginated_projects = paginator.paginate_queryset(projects, request)
        serializer = ProjectSerializer(paginated_projects, many=True)

        # Cache the first page if no pagination requested
        if not request.query_params.get("page"):
            cache_project_list(request.user.id, serializer.data)
            return Response({"success": True, "projects": serializer.data})

        # Return paginated response
        response = paginator.get_paginated_response(serializer.data)
        # Ensure response has success field and projects field
        if hasattr(response, "data") and isinstance(response.data, dict):
            response.data["success"] = True
            # Add projects field for compatibility
            if "results" in response.data:
                response.data["projects"] = response.data["results"]
        return response

    elif request.method == "POST":
        serializer = ProjectCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(owner=request.user)

            # Notify newly assigned collaborators
            if project.assignees.exists():
                notify_project_assignees(project, list(project.assignees.values_list("id", flat=True)), request.user)

            # Invalidate cache
            invalidate_project_cache(request.user.id)

            return Response(
                {"success": True, "message": "Project created successfully", "project": ProjectSerializer(project).data},
                status=status.HTTP_201_CREATED,
            )

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def project_detail(request, pk):
    """Get, update, or delete a specific project"""
    try:
        project = _get_project_or_404_for_user(pk, request.user)
    except Project.DoesNotExist:
        return Response({"success": False, "message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        # Try to get from cache first
        cached_data = get_cached_project_detail(request.user.id, pk)
        if cached_data:
            return Response({"success": True, "project": cached_data})

        serializer = ProjectSerializer(project)
        project_data = serializer.data

        # Cache the result
        cache_project_detail(request.user.id, pk, project_data)

        return Response({"success": True, "project": project_data})

    elif request.method == "PUT":
        serializer = ProjectCreateUpdateSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            old_assignees = set(project.assignees.values_list("id", flat=True))
            serializer.save()
            project.refresh_from_db()
            new_assignees = set(project.assignees.values_list("id", flat=True))
            added = list(new_assignees - old_assignees)
            if added:
                notify_project_assignees(project, added, request.user)

            # Invalidate cache
            invalidate_project_cache(request.user.id, pk)

            return Response(
                {"success": True, "message": "Project updated successfully", "project": ProjectSerializer(project).data}
            )

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        # Only owners can delete
        if project.owner_id != request.user.id:
            return Response(
                {"success": False, "message": "Only project owners can delete projects"}, status=status.HTTP_403_FORBIDDEN
            )
        project.delete()

        # Invalidate cache
        invalidate_project_cache(request.user.id, pk)

        return Response({"success": True, "message": "Project deleted successfully"})


# Task Views
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    """List tasks for a specific project or create a new task"""
    project_id = request.query_params.get("projectId")
    assigned_to_me = request.query_params.get("assignedToMe") in ["1", "true", "True"]
    user_id = request.query_params.get("userId")  # Get userId parameter

    if request.method == "GET":
        if user_id and str(request.user.id) != user_id:
            return Response(
                {"success": False, "message": "You are not allowed to view another user's tasks"},
                status=status.HTTP_403_FORBIDDEN,
            )

        tasks = _task_queryset_for_user(request.user)

        project_id_int = None
        if project_id:
            try:
                project_id_int = int(project_id)
            except (TypeError, ValueError):
                return Response(
                    {"success": False, "message": "Invalid projectId parameter"}, status=status.HTTP_400_BAD_REQUEST
                )

        if project_id_int is not None:
            try:
                project = _get_project_or_404_for_user(project_id_int, request.user)
                tasks = tasks.filter(project=project)
            except Project.DoesNotExist:
                return Response({"success": False, "message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        if assigned_to_me or user_id:
            tasks = tasks.filter(assignees=request.user)

        # Try to get from cache first (only for first page, no filters)
        if not project_id and not assigned_to_me and not user_id and not request.query_params.get("page"):
            cached_data = get_cached_task_list(request.user.id, None)
            if cached_data:
                return Response({"success": True, "tasks": cached_data})

        paginator = TaskPagination()
        tasks = tasks.distinct().order_by("-created_at")
        paginated_tasks = paginator.paginate_queryset(tasks, request)
        serializer = TaskSerializer(paginated_tasks, many=True)

        # Cache the first page if no filters and no pagination requested
        if not project_id and not assigned_to_me and not user_id and not request.query_params.get("page"):
            cache_task_list(request.user.id, None, serializer.data)
            return Response({"success": True, "tasks": serializer.data})

        # Return paginated response
        response = paginator.get_paginated_response(serializer.data)
        # Ensure response has success field and tasks field
        if hasattr(response, "data") and isinstance(response.data, dict):
            response.data["success"] = True
            # Add tasks field for compatibility
            if "results" in response.data:
                response.data["tasks"] = response.data["results"]
        return response

    elif request.method == "POST":
        serializer = TaskCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Verify the project belongs to the user
            project = serializer.validated_data.get("project")
            try:
                # Use select_related for optimized query
                Project.objects.select_related("owner").get(pk=project.id, owner=request.user)
                task = serializer.save(owner=request.user)

                # Send notifications to assigned users
                assignee_ids = request.data.get("assignee_ids", [])
                if assignee_ids:
                    notify_task_assignees(task, assignee_ids, request.user)

                # Invalidate cache
                invalidate_task_cache(request.user.id, task.id, project.id if project else None)

                return Response(
                    {"success": True, "message": "Task created successfully", "task": TaskSerializer(task).data},
                    status=status.HTTP_201_CREATED,
                )
            except Project.DoesNotExist:
                return Response({"success": False, "message": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    """Get, update, or delete a specific task"""
    try:
        task = _get_task_or_404_for_user(pk, request.user)
    except Task.DoesNotExist:
        return Response({"success": False, "message": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        # Try to get from cache first
        cached_data = get_cached_task_detail(request.user.id, pk)
        if cached_data:
            return Response({"success": True, "task": cached_data})

        serializer = TaskSerializer(task)
        task_data = serializer.data

        # Cache the result
        cache_task_detail(request.user.id, pk, task_data)

        return Response({"success": True, "task": task_data})

    elif request.method == "PUT":
        if task.owner_id != request.user.id:
            return Response(
                {"success": False, "message": "Only the task owner can update this task"}, status=status.HTTP_403_FORBIDDEN
            )

        serializer = TaskCreateUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            old_assignee_ids = set(task.assignees.values_list("id", flat=True))
            old_status = task.status
            old_priority = task.priority
            old_due_date = task.due_date

            serializer.save()
            task.refresh_from_db()

            new_assignee_ids = set(task.assignees.values_list("id", flat=True))
            newly_assigned_ids = new_assignee_ids - old_assignee_ids
            if newly_assigned_ids:
                notify_task_assignees(task, list(newly_assigned_ids), request.user)

            if old_status != task.status or old_priority != task.priority or old_due_date != task.due_date:
                if old_status != "completed" and task.status == "completed":
                    create_task_completed_notifications(task, request.user)
                else:
                    create_task_update_notifications(task, request.user)

            # Invalidate cache
            invalidate_task_cache(request.user.id, pk, task.project_id if task.project else None)

            return Response({"success": True, "message": "Task updated successfully", "task": TaskSerializer(task).data})

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        if task.owner_id != request.user.id:
            return Response(
                {"success": False, "message": "Only the task owner can delete this task"}, status=status.HTTP_403_FORBIDDEN
            )
        project_id = task.project_id if task.project else None
        task.delete()

        # Invalidate cache
        invalidate_task_cache(request.user.id, pk, project_id)

        return Response({"success": True, "message": "Task deleted successfully"})


# Comment Views
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_comments_list_create(request, task_id):
    """Get all comments for a task or create a new comment"""
    try:
        task = _get_task_or_404_for_user(task_id, request.user)
    except Task.DoesNotExist:
        return Response({"success": False, "message": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        # Use optimized queryset with select_related
        comments = TaskComment.objects.filter(task=task).select_related("author", "task").order_by("-created_at")

        # Apply pagination
        paginator = CommentPagination()
        paginated_comments = paginator.paginate_queryset(comments, request)
        serializer = TaskCommentSerializer(paginated_comments, many=True, context={"request": request})

        # Return paginated response if page parameter is provided
        if request.query_params.get("page"):
            return paginator.get_paginated_response(serializer.data)

        return Response({"success": True, "comments": serializer.data})

    elif request.method == "POST":
        serializer = TaskCommentSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            comment = serializer.save(task=task, author=request.user)
            return Response(
                {
                    "success": True,
                    "message": "Comment created successfully",
                    "comment": TaskCommentSerializer(comment, context={"request": request}).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def task_comment_detail(request, task_id, comment_id):
    """Retrieve, update, or delete a specific comment"""
    try:
        task = _get_task_or_404_for_user(task_id, request.user)
        comment = TaskComment.objects.select_related("author", "task").get(pk=comment_id, task=task)
    except (Task.DoesNotExist, TaskComment.DoesNotExist):
        return Response({"success": False, "message": "Comment not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = TaskCommentSerializer(comment)
        return Response({"success": True, "comment": serializer.data})

    if request.method == "PUT":
        if comment.author_id != request.user.id:
            return Response(
                {"success": False, "message": "Only the comment author can update this comment"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = TaskCommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Comment updated successfully", "comment": serializer.data})
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    if comment.author_id != request.user.id and task.owner_id != request.user.id:
        return Response(
            {"success": False, "message": "Only the author or task owner can delete this comment"},
            status=status.HTTP_403_FORBIDDEN,
        )

    comment.delete()
    return Response({"success": True, "message": "Comment deleted successfully"})


# Attachment Views
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def task_attachments_list_create(request, task_id):
    """Get all attachments for a task or upload a new attachment"""
    try:
        task = _get_task_or_404_for_user(task_id, request.user)
    except Task.DoesNotExist:
        return Response({"success": False, "message": "Task not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        # Use optimized queryset with select_related
        attachments = TaskAttachment.objects.filter(task=task).select_related("uploaded_by", "task").order_by("-created_at")

        # Apply pagination
        paginator = AttachmentPagination()
        paginated_attachments = paginator.paginate_queryset(attachments, request)
        serializer = TaskAttachmentSerializer(paginated_attachments, many=True, context={"request": request})

        # Return paginated response if page parameter is provided
        if request.query_params.get("page"):
            return paginator.get_paginated_response(serializer.data)

        return Response({"success": True, "attachments": serializer.data})

    elif request.method == "POST":
        if "file" not in request.FILES:
            return Response({"success": False, "message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES["file"]
        name = request.data.get("name", file.name)

        # Validate file size (200 MB max)
        if file.size > 209715200:  # 200 MB
            return Response(
                {"success": False, "message": "File size exceeds 200 MB limit"}, status=status.HTTP_400_BAD_REQUEST
            )

        attachment = TaskAttachment.objects.create(
            task=task, file=file, name=name, file_size=file.size, file_type=file.content_type or "", uploaded_by=request.user
        )

        serializer = TaskAttachmentSerializer(attachment, context={"request": request})
        return Response(
            {"success": True, "message": "Attachment uploaded successfully", "attachment": serializer.data},
            status=status.HTTP_201_CREATED,
        )


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def task_attachment_detail(request, task_id, attachment_id):
    """Download or delete a specific attachment"""
    try:
        task = _get_task_or_404_for_user(task_id, request.user)
        attachment = TaskAttachment.objects.select_related("uploaded_by", "task").get(pk=attachment_id, task=task)
    except (Task.DoesNotExist, TaskAttachment.DoesNotExist):
        return Response({"success": False, "message": "Attachment not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        try:
            file_response = FileResponse(attachment.file.open(), as_attachment=True, filename=attachment.name)
            return file_response
        except FileNotFoundError:
            return Response({"success": False, "message": "File not found on server"}, status=status.HTTP_404_NOT_FOUND)

    elif request.method == "DELETE":
        if attachment.uploaded_by_id != request.user.id and task.owner_id != request.user.id:
            return Response(
                {"success": False, "message": "Only the uploader or task owner can delete this attachment"},
                status=status.HTTP_403_FORBIDDEN,
            )
        # Delete the file from storage
        attachment.file.delete()
        attachment.delete()
        return Response({"success": True, "message": "Attachment deleted successfully"})


# Statistics Views
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def statistics_overview(request):
    """Get statistics overview for the authenticated user"""
    user = request.user

    # Try to get from cache first
    cached_stats = get_cached_statistics(user.id)
    if cached_stats:
        return Response({"success": True, "statistics": cached_stats})

    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)

    # Optimize statistics queries using a single queryset with annotations
    # This reduces the number of database queries from ~15 to ~3

    # Get all tasks for the user in one query
    user_tasks = Task.objects.filter(owner=user).only("status", "priority", "due_date", "completed_at", "created_at")

    # Task statistics - use aggregation instead of multiple queries
    task_stats = user_tasks.aggregate(
        total=Count("id"),
        completed=Count("id", filter=Q(status="completed")),
        in_progress=Count("id", filter=Q(status="in_progress")),
        todo=Count("id", filter=Q(status="todo")),
        high_priority=Count("id", filter=Q(priority="high")),
        medium_priority=Count("id", filter=Q(priority="medium")),
        low_priority=Count("id", filter=Q(priority="low")),
        overdue=Count("id", filter=Q(due_date__lt=now, status__in=["todo", "in_progress"])),
        recent_completed=Count("id", filter=Q(status="completed", completed_at__gte=thirty_days_ago)),
        recent_created=Count("id", filter=Q(created_at__gte=thirty_days_ago)),
    )

    total_tasks = task_stats["total"] or 0
    completed_tasks = task_stats["completed"] or 0
    in_progress_tasks = task_stats["in_progress"] or 0
    todo_tasks = task_stats["todo"] or 0
    high_priority_tasks = task_stats["high_priority"] or 0
    medium_priority_tasks = task_stats["medium_priority"] or 0
    low_priority_tasks = task_stats["low_priority"] or 0
    overdue_tasks = task_stats["overdue"] or 0
    recent_completed = task_stats["recent_completed"] or 0
    recent_created = task_stats["recent_created"] or 0

    # Task completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    # Project statistics - optimized with select_related
    projects = Project.objects.filter(owner=user).select_related("owner")
    total_projects = projects.count()
    projects_with_tasks = projects.annotate(task_count=Count("tasks")).filter(task_count__gt=0).count()

    # Comments and attachments - optimized with select_related
    total_comments = TaskComment.objects.filter(author=user).select_related("author").count()
    total_attachments = TaskAttachment.objects.filter(uploaded_by=user).select_related("uploaded_by").count()

    # Tasks assigned to me (by others) - optimized
    assigned_to_me = Task.objects.filter(assignees=user).exclude(owner=user).select_related("owner", "project").count()

    # Tasks by project - optimized with select_related
    tasks_by_project = projects.annotate(task_count=Count("tasks")).values("id", "name", "task_count")[:10]

    # Daily completion trend (last 7 days) - optimized with single query
    daily_completions = []
    for i in range(7):
        date = now - timedelta(days=6 - i)
        count = user_tasks.filter(status="completed", completed_at__date=date.date()).count()
        daily_completions.append({"date": date.date().isoformat(), "count": count})

    # Calculate statistics
    stats_data = {
        "tasks": {
            "total": total_tasks,
            "completed": completed_tasks,
            "in_progress": in_progress_tasks,
            "todo": todo_tasks,
            "completion_rate": round(completion_rate, 2),
            "overdue": overdue_tasks,
            "recent_completed": recent_completed,
            "recent_created": recent_created,
            "assigned_to_me": assigned_to_me,
        },
        "priorities": {
            "high": high_priority_tasks,
            "medium": medium_priority_tasks,
            "low": low_priority_tasks,
        },
        "projects": {
            "total": total_projects,
            "with_tasks": projects_with_tasks,
            "tasks_by_project": list(tasks_by_project),
        },
        "activity": {
            "total_comments": total_comments,
            "total_attachments": total_attachments,
        },
        "trends": {
            "daily_completions": daily_completions,
        },
    }

    # Cache the statistics
    cache_statistics(user.id, stats_data)

    return Response({"success": True, "statistics": stats_data})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def upload_list_create(request):
    """List standalone user uploads or persist a new upload."""
    if request.method == "GET":
        uploads = UserUpload.objects.filter(owner=request.user).order_by("-created_at")
        serializer = UserUploadSerializer(uploads, many=True, context={"request": request})
        return Response({"success": True, "uploads": serializer.data})

    if "file" not in request.FILES:
        return Response({"success": False, "message": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES["file"]
    name = request.data.get("name", file.name)

    if file.size > 50 * 1024 * 1024:
        return Response({"success": False, "message": "File size exceeds 50 MB limit"}, status=status.HTTP_400_BAD_REQUEST)

    allowed_types = {"text/csv", "application/vnd.ms-excel", "text/plain"}
    if file.content_type and file.content_type not in allowed_types:
        return Response(
            {"success": False, "message": "Only CSV or plain text uploads are supported"}, status=status.HTTP_400_BAD_REQUEST
        )

    preview = ""
    try:
        chunks = []
        for chunk in file.chunks():
            chunks.append(chunk)
            if sum(len(item) for item in chunks) >= 8192:
                break
        preview = b"".join(chunks).decode("utf-8", errors="replace").splitlines()[:10]
        preview = "\n".join(preview)
        file.seek(0)
    except Exception:
        preview = ""

    upload = UserUpload.objects.create(
        owner=request.user,
        file=file,
        name=name,
        file_size=file.size,
        file_type=file.content_type or "",
        preview=preview,
    )

    serializer = UserUploadSerializer(upload, context={"request": request})
    return Response({"success": True, "upload": serializer.data}, status=status.HTTP_201_CREATED)


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def upload_detail(request, upload_id):
    """Download or delete a standalone user upload."""
    try:
        upload = UserUpload.objects.get(pk=upload_id, owner=request.user)
    except UserUpload.DoesNotExist:
        return Response({"success": False, "message": "Upload not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        try:
            return FileResponse(upload.file.open(), as_attachment=True, filename=upload.name)
        except FileNotFoundError:
            return Response({"success": False, "message": "File not found on server"}, status=status.HTTP_404_NOT_FOUND)

    upload.file.delete()
    upload.delete()
    return Response({"success": True, "message": "Upload deleted successfully"})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def calendar_event_list_create(request):
    """List or create custom calendar events for the authenticated user."""
    if request.method == "GET":
        events = CalendarEvent.objects.filter(owner=request.user).order_by("start", "created_at")
        serializer = CalendarEventSerializer(events, many=True)
        return Response({"success": True, "events": serializer.data})

    serializer = CalendarEventSerializer(data=request.data)
    if serializer.is_valid():
        event = serializer.save(owner=request.user)
        return Response(
            {"success": True, "message": "Calendar event created successfully", "event": CalendarEventSerializer(event).data},
            status=status.HTTP_201_CREATED,
        )

    return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def calendar_event_detail(request, event_id):
    """Retrieve, update, or delete a custom calendar event."""
    try:
        event = CalendarEvent.objects.get(pk=event_id, owner=request.user)
    except CalendarEvent.DoesNotExist:
        return Response({"success": False, "message": "Calendar event not found"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response({"success": True, "event": CalendarEventSerializer(event).data})

    if request.method == "PUT":
        serializer = CalendarEventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "message": "Calendar event updated successfully", "event": serializer.data})
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    event.delete()
    return Response({"success": True, "message": "Calendar event deleted successfully"})
