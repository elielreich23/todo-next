from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    task_title = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'task', 'task_title', 
                 'project', 'project_name', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_task_title(self, obj):
        return obj.task.title if obj.task else None
    
    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

