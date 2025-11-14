from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Notification
from .notification_serializers import NotificationSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications(request):
    """Get all notifications for the current user"""
    notifications = Notification.objects.filter(recipient=request.user)
    serializer = NotificationSerializer(notifications, many=True)
    return Response({
        'success': True,
        'notifications': serializer.data,
        'unread_count': notifications.filter(is_read=False).count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_notifications(request):
    """Get unread notifications for the current user"""
    notifications = Notification.objects.filter(recipient=request.user, is_read=False)
    serializer = NotificationSerializer(notifications, many=True)
    return Response({
        'success': True,
        'notifications': serializer.data,
        'count': notifications.count()
    })


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, pk):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(pk=pk, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({
            'success': True,
            'message': 'Notification marked as read'
        })
    except Notification.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notification not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read(request):
    """Mark all notifications as read for the current user"""
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({
        'success': True,
        'message': 'All notifications marked as read'
    })

