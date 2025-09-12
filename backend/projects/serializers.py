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


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'priority', 'status', 'due_date', 
                 'completed_at', 'created_at', 'updated_at', 'project', 'project_name']
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'status', 'due_date', 'project']
