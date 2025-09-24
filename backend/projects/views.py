from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Project, Task
from .serializers import ProjectSerializer, TaskSerializer, TaskCreateUpdateSerializer


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
    
    if request.method == 'GET':
        if project_id:
            try:
                project = Project.objects.get(pk=project_id, owner=request.user)
                tasks = Task.objects.filter(project=project, owner=request.user)
            except Project.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Project not found'
                }, status=status.HTTP_404_NOT_FOUND)
        else:
            tasks = Task.objects.filter(owner=request.user)
        # filter tasks assigned to current user if requested
        if assigned_to_me:
            tasks = tasks.filter(assignees=request.user)
        
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
            serializer.save()
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
