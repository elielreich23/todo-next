from rest_framework import serializers

from .models import CalendarEvent, Project, Task, TaskAttachment, TaskComment, UserUpload


class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        from accounts.models import User

        model = User
        fields = ["id", "username", "email", "full_name"]


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    assignees = UserLiteSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ["id", "name", "description", "color", "created_at", "updated_at", "tasks_count", "assignees"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_tasks_count(self, obj):
        return obj.tasks.count()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    # Accept a list of user IDs to assign; resolved in create/update
    assignee_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)

    class Meta:
        model = Project
        fields = ["name", "description", "color", "assignee_ids"]

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", [])
        project = super().create(validated_data)
        if assignees:
            from accounts.models import User

            users = User.objects.filter(id__in=assignees)
            project.assignees.set(users)
        return project

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        project = super().update(instance, validated_data)
        if assignees is not None:
            from accounts.models import User

            users = User.objects.filter(id__in=assignees)
            project.assignees.set(users)
        return project


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    assignees = UserLiteSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "completed_at",
            "created_at",
            "updated_at",
            "project",
            "project_name",
            "assignees",
            "progress",
            "total_steps",
            "category",
            "duration",
            "notes",
        ]
        read_only_fields = ["id", "completed_at", "created_at", "updated_at"]


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    # Accept a list of user IDs to assign; resolved in create/update
    assignee_ids = serializers.ListField(child=serializers.IntegerField(), required=False, write_only=True)

    class Meta:
        model = Task
        fields = [
            "title",
            "description",
            "priority",
            "status",
            "due_date",
            "project",
            "assignee_ids",
            "progress",
            "total_steps",
            "category",
            "duration",
            "notes",
        ]

    def create(self, validated_data):
        assignees = validated_data.pop("assignee_ids", [])
        task = super().create(validated_data)
        if assignees:
            from accounts.models import User

            users = User.objects.filter(id__in=assignees)
            task.assignees.set(users)
        return task

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignee_ids", None)
        task = super().update(instance, validated_data)
        if assignees is not None:
            from accounts.models import User

            users = User.objects.filter(id__in=assignees)
            task.assignees.set(users)
        return task


class TaskCommentSerializer(serializers.ModelSerializer):
    author = UserLiteSerializer(read_only=True)
    task = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = TaskComment
        fields = ["id", "task", "author", "text", "created_at", "updated_at"]
        read_only_fields = ["id", "task", "author", "created_at", "updated_at"]


class TaskAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserLiteSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = TaskAttachment
        fields = ["id", "task", "file", "file_url", "name", "file_size", "file_type", "uploaded_by", "created_at"]
        read_only_fields = ["id", "created_at", "file_size", "file_type"]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class UserUploadSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = UserUpload
        fields = ["id", "file", "file_url", "name", "file_size", "file_type", "preview", "created_at"]
        read_only_fields = ["id", "file_url", "file_size", "file_type", "preview", "created_at"]

    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class CalendarEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = CalendarEvent
        fields = [
            "id",
            "title",
            "start",
            "end",
            "link",
            "guests",
            "description",
            "color",
            "external_provider",
            "external_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "external_provider", "external_id", "created_at", "updated_at"]
