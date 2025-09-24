from rest_framework import serializers
from .models import Project, Task


class ProjectSerializer(serializers.ModelSerializer):
    tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'color', 'created_at', 'updated_at', 'tasks_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.count()


class UserLiteSerializer(serializers.ModelSerializer):
    class Meta:
        from accounts.models import User
        model = User
        fields = ['id', 'username', 'email', 'full_name']


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    assignees = UserLiteSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'status', 'due_date', 
                 'completed_at', 'created_at', 'updated_at', 'project', 'project_name', 'assignees']
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    # Accept a list of user IDs to assign; resolved in create/update
    assignee_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, write_only=True
    )

    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'status', 'due_date', 'project', 'assignee_ids']

    def create(self, validated_data):
        assignees = validated_data.pop('assignee_ids', [])
        task = super().create(validated_data)
        if assignees:
            from accounts.models import User
            users = User.objects.filter(id__in=assignees)
            task.assignees.set(users)
        return task

    def update(self, instance, validated_data):
        assignees = validated_data.pop('assignee_ids', None)
        task = super().update(instance, validated_data)
        if assignees is not None:
            from accounts.models import User
            users = User.objects.filter(id__in=assignees)
            task.assignees.set(users)
        return task
