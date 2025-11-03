from rest_framework import serializers
from .models import User, Project, Task
from django.contrib.auth.hashers import make_password


class UserSignupSerializer(serializers.Serializer):
    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError("Email already registered")
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class SignupResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = UserSerializer()


class LoginResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    user = UserSerializer()
    token = serializers.CharField(allow_null=True)


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['name', 'category', 'description', 'duration', 'contributors']


class TaskSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['project_id', 'title', 'description', 'status', 'due_date', 'progress', 
                 'total_steps', 'category', 'contributors', 'duration', 'notes', 
                 'attachments', 'comments']


class CommentSerializer(serializers.Serializer):
    id = serializers.CharField()
    text = serializers.CharField()
    author = serializers.CharField()
    created_at = serializers.CharField()
    updated_at = serializers.CharField(required=False, allow_null=True)


class CommentCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
    author = serializers.CharField()


class CommentUpdateSerializer(serializers.Serializer):
    text = serializers.CharField()


class ProfileUpdateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)
    full_name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("New passwords do not match")
        return data


class AccountDeleteSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)

