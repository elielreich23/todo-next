from rest_framework import serializers

from .models import Notification
from .serializers import UserLiteSerializer


class NotificationSerializer(serializers.ModelSerializer):
    task_title = serializers.SerializerMethodField()
    project_name = serializers.SerializerMethodField()
    sender = UserLiteSerializer(read_only=True)
    sender_avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "notification_type",
            "title",
            "message",
            "task",
            "task_title",
            "project",
            "project_name",
            "sender",
            "sender_avatar_url",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_task_title(self, obj):
        return obj.task.title if obj.task else None

    def get_project_name(self, obj):
        return obj.project.name if obj.project else None

    def get_sender_avatar_url(self, obj):
        if obj.sender and obj.sender.avatar:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.sender.avatar.url)
            return obj.sender.avatar.url
        return None
