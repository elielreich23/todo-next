from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification
from .notification_serializers import NotificationSerializer
from .pagination import NotificationPagination


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """Get all notifications for the current user with pagination and optimization"""
    # Optimize query with select_related for task and project
    notifications = (
        Notification.objects.filter(recipient=request.user)
        .select_related("recipient", "task", "project", "task__owner", "task__project")
        .order_by("-created_at")
    )

    # Get unread count efficiently
    unread_count = notifications.filter(is_read=False).count()

    # Apply pagination
    paginator = NotificationPagination()
    paginated_notifications = paginator.paginate_queryset(notifications, request)
    serializer = NotificationSerializer(paginated_notifications, many=True)

    # Return paginated response if page parameter is provided
    if request.query_params.get("page"):
        response = paginator.get_paginated_response(serializer.data)
        response.data["unread_count"] = unread_count
        return response

    return Response({"success": True, "notifications": serializer.data, "unread_count": unread_count})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_notifications(request):
    """Get unread notifications for the current user with pagination and optimization"""
    # Optimize query with select_related
    notifications = (
        Notification.objects.filter(recipient=request.user, is_read=False)
        .select_related("recipient", "task", "project", "task__owner", "task__project")
        .order_by("-created_at")
    )

    # Apply pagination
    paginator = NotificationPagination()
    paginated_notifications = paginator.paginate_queryset(notifications, request)
    serializer = NotificationSerializer(paginated_notifications, many=True)

    # Return paginated response if page parameter is provided
    if request.query_params.get("page"):
        response = paginator.get_paginated_response(serializer.data)
        response.data["count"] = notifications.count()
        return response

    return Response({"success": True, "notifications": serializer.data, "count": notifications.count()})


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """Mark a notification as read - optimized with select_related"""
    try:
        notification = Notification.objects.select_related("recipient", "task", "project").get(pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save(update_fields=["is_read"])  # Only update the is_read field
        return Response({"success": True, "message": "Notification marked as read"})
    except Notification.DoesNotExist:
        return Response({"success": False, "message": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user"""
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({"success": True, "message": "All notifications marked as read"})
