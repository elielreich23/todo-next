from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.db import models
from datetime import datetime
import json

from .models import User, Project, Task
from .serializers import (
    UserSignupSerializer, UserLoginSerializer, UserSerializer,
    SignupResponseSerializer, LoginResponseSerializer,
    ProjectSerializer, ProjectCreateSerializer,
    TaskSerializer, TaskCreateSerializer,
    CommentSerializer, CommentCreateSerializer, CommentUpdateSerializer,
    ProfileUpdateSerializer, PasswordChangeSerializer, AccountDeleteSerializer
)


@api_view(['GET'])
def root(request):
    return Response({"message": "Taskero API is running!"})


@api_view(['GET'])
def health_check(request):
    return Response({"status": "healthy", "message": "Backend is working!"})


# Authentication views
@api_view(['POST'])
def signup(request):
    """User signup endpoint"""
    serializer = UserSignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User(
        email=serializer.validated_data['email'],
        username=serializer.validated_data['username'],
        full_name=serializer.validated_data.get('full_name', ''),
        is_active=True
    )
    user.set_password(serializer.validated_data['password'])
    user.save()
    
    user_serializer = UserSerializer(user)
    return Response({
        "success": True,
        "message": "User created successfully",
        "user": user_serializer.data
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login(request):
    """User login endpoint"""
    serializer = UserLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            {"detail": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=serializer.validated_data['email'].lower())
    except User.DoesNotExist:
        return Response(
            {"detail": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.check_password(serializer.validated_data['password']):
        return Response(
            {"detail": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    if not user.is_active:
        return Response(
            {"detail": "Account is deactivated"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    user_serializer = UserSerializer(user)
    return Response({
        "success": True,
        "message": "Login successful",
        "user": user_serializer.data,
        "token": None  # Simple session for now, can be enhanced later
    })


# Project views
@api_view(['GET', 'POST'])
def project_list(request):
    """Get all projects or create a new project"""
    if request.method == 'GET':
        projects = Project.objects.all()
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ProjectCreateSerializer(data=request.data)
        if serializer.is_valid():
            project = Project.objects.create(**serializer.validated_data)
            return Response(
                ProjectSerializer(project).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def project_detail(request):
    """Update or delete a project"""
    project_id = request.data.get('project_id') or request.query_params.get('project_id')
    
    if not project_id:
        return Response(
            {"detail": "project_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response(
            {"detail": "Project not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = ProjectCreateSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(ProjectSerializer(project).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        project.delete()
        return Response({"message": "Project deleted successfully"})


# Task views
@api_view(['GET', 'POST'])
def task_list(request):
    """Get tasks or create a new task"""
    if request.method == 'GET':
        project_id = request.query_params.get('project_id')
        tasks = Task.objects.all()
        if project_id:
            tasks = tasks.filter(project_id=project_id)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TaskCreateSerializer(data=request.data)
        if serializer.is_valid():
            project_id = serializer.validated_data.pop('project_id')
            try:
                project = Project.objects.get(id=project_id)
            except Project.DoesNotExist:
                return Response(
                    {"detail": "Project not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            task = Task.objects.create(project=project, **serializer.validated_data)
            return Response(
                TaskSerializer(task).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def task_detail(request):
    """Update or delete a task"""
    task_id = request.data.get('task_id') or request.query_params.get('task_id')
    
    if not task_id:
        return Response(
            {"detail": "task_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response(
            {"detail": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = TaskCreateSerializer(task, data=request.data, partial=True)
        if serializer.is_valid():
            # Handle project_id update if provided
            if 'project_id' in serializer.validated_data:
                project_id = serializer.validated_data.pop('project_id')
                try:
                    project = Project.objects.get(id=project_id)
                    task.project = project
                except Project.DoesNotExist:
                    return Response(
                        {"detail": "Project not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            for key, value in serializer.validated_data.items():
                setattr(task, key, value)
            task.save()
            return Response(TaskSerializer(task).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        task.delete()
        return Response({"message": "Task deleted successfully"})


# Task comments views
@api_view(['GET', 'POST'])
def task_comments(request, task_id):
    """Get comments for a task or add a comment"""
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response(
            {"detail": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        comments = task.comments or []
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            new_comment = {
                "id": str(int(timezone.now().timestamp() * 1000)),
                "text": serializer.validated_data['text'],
                "author": serializer.validated_data['author'],
                "created_at": timezone.now().isoformat()
            }
            
            comments = task.comments or []
            comments.append(new_comment)
            task.comments = comments
            task.save()
            
            return Response(new_comment, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def task_comment_detail(request, task_id):
    """Update or delete a comment"""
    comment_id = request.data.get('comment_id') or request.query_params.get('comment_id')
    
    if not comment_id:
        return Response(
            {"detail": "comment_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return Response(
            {"detail": "Task not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    comments = task.comments or []
    comment_index = None
    
    for i, c in enumerate(comments):
        if c.get("id") == comment_id:
            comment_index = i
            break
    
    if comment_index is None:
        return Response(
            {"detail": "Comment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        serializer = CommentUpdateSerializer(data=request.data)
        if serializer.is_valid():
            comments[comment_index]["text"] = serializer.validated_data['text']
            comments[comment_index]["updated_at"] = timezone.now().isoformat()
            task.comments = comments
            task.save()
            return Response(comments[comment_index])
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        comments = [c for c in comments if c.get("id") != comment_id]
        task.comments = comments
        task.save()
        return Response({"message": "Comment deleted successfully"})


# Test users endpoint
@api_view(['POST'])
def create_test_users(request):
    """Create three test users for testing purposes"""
    from django.db import transaction
    
    test_users = [
        {
            "email": "admin@taskero.com",
            "username": "admin",
            "password": "admin123",
            "full_name": "Admin User"
        },
        {
            "email": "user1@taskero.com",
            "username": "user1",
            "password": "user123",
            "full_name": "Regular User 1"
        },
        {
            "email": "user2@taskero.com",
            "username": "user2",
            "password": "user123",
            "full_name": "Regular User 2"
        }
    ]
    
    created_users = []
    
    with transaction.atomic():
        for user_data in test_users:
            # Check if user already exists
            if not User.objects.filter(
                models.Q(email=user_data["email"]) | models.Q(username=user_data["username"])
            ).exists():
                user = User(
                    email=user_data["email"],
                    username=user_data["username"],
                    full_name=user_data["full_name"],
                    is_active=True
                )
                user.set_password(user_data["password"])
                user.save()
                created_users.append({
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.full_name
                })
    
    return Response({
        "success": True,
        "message": f"Created {len(created_users)} test users",
        "users": created_users
    })


@api_view(['GET'])
def get_users(request):
    """Get all users (for testing)"""
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response({
        "total_users": len(users),
        "users": serializer.data
    })


# User profile management views
@api_view(['GET', 'PUT'])
def user_profile(request):
    """Get or update user profile"""
    user_id = request.data.get('user_id') or request.query_params.get('user_id')
    
    if not user_id:
        return Response(
            {"detail": "user_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Check for email/username conflicts
            if 'email' in serializer.validated_data:
                email = serializer.validated_data['email'].lower()
                existing = User.objects.filter(email=email).exclude(id=user_id).first()
                if existing:
                    return Response(
                        {"detail": "Email already registered"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.email = email
            
            if 'username' in serializer.validated_data:
                username = serializer.validated_data['username']
                existing = User.objects.filter(username=username).exclude(id=user_id).first()
                if existing:
                    return Response(
                        {"detail": "Username already taken"},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                user.username = username
            
            if 'full_name' in serializer.validated_data:
                user.full_name = serializer.validated_data['full_name']
            
            user.save()
            serializer = UserSerializer(user)
            return Response({
                "success": True,
                "message": "Profile updated successfully",
                "user": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def change_password(request):
    """Change user password"""
    user_id = request.data.get('user_id')
    
    if not user_id:
        return Response(
            {"detail": "user_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        # Verify current password
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {"detail": "Current password is incorrect"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({
            "success": True,
            "message": "Password updated successfully"
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def delete_account(request):
    """Delete user account"""
    user_id = request.data.get('user_id') or request.query_params.get('user_id')
    password = request.data.get('password')
    
    if not user_id:
        return Response(
            {"detail": "user_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not password:
        return Response(
            {"detail": "Password is required to confirm account deletion"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Verify password
    if not user.check_password(password):
        return Response(
            {"detail": "Incorrect password"},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Delete the user
    user.delete()
    
    return Response({
        "success": True,
        "message": "Account deleted successfully"
    })

