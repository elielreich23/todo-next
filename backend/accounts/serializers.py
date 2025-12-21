from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import User, UserSession


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "full_name"]
        read_only_fields = ["id"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "full_name", "password", "password_confirm"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")

        # Extract all fields from validated_data to avoid passing them twice
        email = validated_data.pop("email")
        username = validated_data.pop("username")
        full_name = validated_data.pop("full_name")

        # Create user manually to avoid create_user() conflicts with custom USERNAME_FIELD
        # Since USERNAME_FIELD is "email", we set email as the username field
        user = User(
            email=email,  # This is the USERNAME_FIELD
            username=username,  # This is a separate field in REQUIRED_FIELDS
            full_name=full_name,
        )
        user.set_password(password)  # Set password using set_password for proper hashing
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid email or password")
            if not user.is_active:
                raise serializers.ValidationError("Account is deactivated")
            attrs["user"] = user
            return attrs
        else:
            raise serializers.ValidationError("Must include email and password")


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetSerializer(serializers.Serializer):
    token = serializers.CharField()
    uid = serializers.CharField()
    password = serializers.CharField(min_length=8)
    password_confirm = serializers.CharField(min_length=8)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return attrs


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user session information"""

    is_active = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            "id",
            "device_name",
            "browser",
            "os",
            "ip_address",
            "location",
            "is_current",
            "last_activity",
            "created_at",
            "is_active",
        ]
        read_only_fields = fields

    def get_is_active(self, obj):
        """Check if session is still active"""
        return obj.is_active()
