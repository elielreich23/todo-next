from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.db.models import Count, Q, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Project, Task, TaskComment, TaskAttachment
from .serializers import (
    ProjectSerializer, TaskSerializer, TaskCreateUpdateSerializer,
    TaskCommentSerializer, TaskAttachmentSerializer
)


# Project Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def project_list_create(request):
    """List all projects for the authenticated user or create a new project"""
    if request.method == 'GET':
        projects = Project.objects.filter(owner=request.user)
        serializer = ProjectSerializer(projects, many=True)
        return Response({
            'success': True,
            'projects': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project = serializer.save(owner=request.user)
            return Response({
                'success': True,
                'message': 'Project created successfully',
                'project': ProjectSerializer(project).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def project_detail(request, pk):
    """Get, update, or delete a specific project"""
    try:
        project = Project.objects.get(pk=pk, owner=request.user)
    except Project.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Project not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = ProjectSerializer(project)
        return Response({
            'success': True,
            'project': serializer.data
        })
    
    elif request.method == 'PUT':
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Project updated successfully',
                'project': serializer.data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        project.delete()
        return Response({
            'success': True,
            'message': 'Project deleted successfully'
        })


# Task Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    """List tasks for a specific project or create a new task"""
    project_id = request.query_params.get('projectId')
    assigned_to_me = request.query_params.get('assignedToMe') in ['1', 'true', 'True']
    user_id = request.query_params.get('userId')  # Get userId parameter
    
    if request.method == 'GET':
        # Determine which user's tasks to fetch
        target_user = request.user
        if user_id:
            try:
                from accounts.models import User
                target_user = User.objects.get(pk=user_id)
            except User.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
        elif assigned_to_me:
            target_user = request.user
        
        if project_id:
            try:
                project = Project.objects.get(pk=project_id)
                # If fetching assigned tasks, don't filter by owner
                if assigned_to_me or user_id:
                    tasks = Task.objects.filter(project=project, assignees=target_user)
                else:
                    tasks = Task.objects.filter(project=project, owner=request.user)
            except Project.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Project not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            # If fetching assigned tasks, get all tasks assigned to the target user
            if assigned_to_me or user_id:
                tasks = Task.objects.filter(assignees=target_user).distinct()
            else:
                tasks = Task.objects.filter(owner=request.user)
        
        serializer = TaskSerializer(tasks, many=True)
        return Response({
            'success': True,
            'tasks': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = TaskCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Verify the project belongs to the user
            project_id = serializer.validated_data.get('project').id
            try:
                project = Project.objects.get(pk=project_id, owner=request.user)
                task = serializer.save(owner=request.user)
                
                # Send notifications to assigned users
                assignee_ids = request.data.get('assignee_ids', [])
                if assignee_ids:
                    from .notifications import notify_task_assignees
                    notify_task_assignees(task, assignee_ids)
                
                return Response({
                    'success': True,
                    'message': 'Task created successfully',
                    'task': TaskSerializer(task).data
                }, status=status.HTTP_201_CREATED)
            except Project.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Project not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, pk):
    """Get, update, or delete a specific task"""
    try:
        task = Task.objects.get(pk=pk, owner=request.user)
    except Task.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Task not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = TaskSerializer(task)
        return Response({
            'success': True,
            'task': serializer.data
        })
    
    elif request.method == 'PUT':
        serializer = TaskCreateUpdateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            # Get assignee IDs before update
            old_assignee_ids = set(task.assignees.values_list('id', flat=True))
            
            serializer.save()
            
            # Get assignee IDs after update
            task.refresh_from_db()
            new_assignee_ids = set(task.assignees.values_list('id', flat=True))
            
            # Find newly assigned users
            newly_assigned_ids = new_assignee_ids - old_assignee_ids
            
            # Send notifications to newly assigned users
            if newly_assigned_ids:
                from .notifications import notify_task_assignees
                notify_task_assignees(task, list(newly_assigned_ids))
            
            return Response({
                'success': True,
                'message': 'Task updated successfully',
                'task': TaskSerializer(task).data
            })
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        task.delete()
        return Response({
            'success': True,
            'message': 'Task deleted successfully'
        })


# Comment Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_comments_list_create(request, task_id):
    """Get all comments for a task or create a new comment"""
    try:
        task = Task.objects.get(pk=task_id, owner=request.user)
    except Task.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Task not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        comments = TaskComment.objects.filter(task=task)
        serializer = TaskCommentSerializer(comments, many=True, context={'request': request})
        return Response({
            'success': True,
            'comments': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = TaskCommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            comment = serializer.save(task=task, author=request.user)
            return Response({
                'success': True,
                'message': 'Comment created successfully',
                'comment': TaskCommentSerializer(comment, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def task_comment_detail(request, task_id, comment_id):
    """Delete a specific comment"""
    try:
        comment = TaskComment.objects.get(pk=comment_id, task_id=task_id, author=request.user)
    except TaskComment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Comment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    comment.delete()
    return Response({
        'success': True,
        'message': 'Comment deleted successfully'
    })


# Attachment Views
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_attachments_list_create(request, task_id):
    """Get all attachments for a task or upload a new attachment"""
    try:
        task = Task.objects.get(pk=task_id, owner=request.user)
    except Task.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Task not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        attachments = TaskAttachment.objects.filter(task=task)
        serializer = TaskAttachmentSerializer(attachments, many=True, context={'request': request})
        return Response({
            'success': True,
            'attachments': serializer.data
        })
    
    elif request.method == 'POST':
        if 'file' not in request.FILES:
            return Response({
                'success': False,
                'message': 'No file provided'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        name = request.data.get('name', file.name)
        
        # Validate file size (200 MB max)
        if file.size > 209715200:  # 200 MB
            return Response({
                'success': False,
                'message': 'File size exceeds 200 MB limit'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        attachment = TaskAttachment.objects.create(
            task=task,
            file=file,
            name=name,
            file_size=file.size,
            file_type=file.content_type or '',
            uploaded_by=request.user
        )
        
        serializer = TaskAttachmentSerializer(attachment, context={'request': request})
        return Response({
            'success': True,
            'message': 'Attachment uploaded successfully',
            'attachment': serializer.data
        }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_attachment_detail(request, task_id, attachment_id):
    """Download or delete a specific attachment"""
    try:
        attachment = TaskAttachment.objects.get(pk=attachment_id, task_id=task_id, task__owner=request.user)
    except TaskAttachment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Attachment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        try:
            file_response = FileResponse(attachment.file.open(), as_attachment=True, filename=attachment.name)
            return file_response
        except FileNotFoundError:
            return Response({
                'success': False,
                'message': 'File not found on server'
            }, status=status.HTTP_404_NOT_FOUND)
    
    elif request.method == 'DELETE':
        # Delete the file from storage
        attachment.file.delete()
        attachment.delete()
        return Response({
            'success': True,
            'message': 'Attachment deleted successfully'
        })


# Statistics Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def statistics_overview(request):
    """Get statistics overview for the authenticated user"""
    user = request.user
    now = timezone.now()
    thirty_days_ago = now - timedelta(days=30)
    
    # Task statistics
    total_tasks = Task.objects.filter(owner=user).count()
    completed_tasks = Task.objects.filter(owner=user, status='completed').count()
    in_progress_tasks = Task.objects.filter(owner=user, status='in_progress').count()
    todo_tasks = Task.objects.filter(owner=user, status='todo').count()
    
    # Task completion rate
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    # Tasks by priority
    high_priority_tasks = Task.objects.filter(owner=user, priority='high').count()
    medium_priority_tasks = Task.objects.filter(owner=user, priority='medium').count()
    low_priority_tasks = Task.objects.filter(owner=user, priority='low').count()
    
    # Overdue tasks
    overdue_tasks = Task.objects.filter(
        owner=user,
        due_date__lt=now,
        status__in=['todo', 'in_progress']
    ).count()
    
    # Tasks completed in last 30 days
    recent_completed = Task.objects.filter(
        owner=user,
        status='completed',
        completed_at__gte=thirty_days_ago
    ).count()
    
    # Tasks created in last 30 days
    recent_created = Task.objects.filter(
        owner=user,
        created_at__gte=thirty_days_ago
    ).count()
    
    # Project statistics
    total_projects = Project.objects.filter(owner=user).count()
    projects_with_tasks = Project.objects.filter(owner=user).annotate(
        task_count=Count('tasks')
    ).filter(task_count__gt=0).count()
    
    # Comments and attachments
    total_comments = TaskComment.objects.filter(author=user).count()
    total_attachments = TaskAttachment.objects.filter(uploaded_by=user).count()
    
    # Tasks assigned to me (by others)
    assigned_to_me = Task.objects.filter(assignees=user).exclude(owner=user).count()
    
    # Tasks by project
    tasks_by_project = Project.objects.filter(owner=user).annotate(
        task_count=Count('tasks')
    ).values('id', 'name', 'task_count')[:10]
    
    # Daily completion trend (last 7 days)
    daily_completions = []
    for i in range(7):
        date = now - timedelta(days=6-i)
        count = Task.objects.filter(
            owner=user,
            status='completed',
            completed_at__date=date.date()
        ).count()
        daily_completions.append({
            'date': date.date().isoformat(),
            'count': count
        })
    
    return Response({
        'success': True,
        'statistics': {
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'in_progress': in_progress_tasks,
                'todo': todo_tasks,
                'completion_rate': round(completion_rate, 2),
                'overdue': overdue_tasks,
                'recent_completed': recent_completed,
                'recent_created': recent_created,
                'assigned_to_me': assigned_to_me,
            },
            'priorities': {
                'high': high_priority_tasks,
                'medium': medium_priority_tasks,
                'low': low_priority_tasks,
            },
            'projects': {
                'total': total_projects,
                'with_tasks': projects_with_tasks,
                'tasks_by_project': list(tasks_by_project),
            },
            'activity': {
                'total_comments': total_comments,
                'total_attachments': total_attachments,
            },
            'trends': {
                'daily_completions': daily_completions,
            }
        }
    })
