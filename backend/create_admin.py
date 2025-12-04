#!/usr/bin/env python
"""
Script to create a Django admin superuser
Supports both development and production settings
"""
import os
import sys

import django

# Setup Django - use production settings if DJANGO_SETTINGS_MODULE is set, otherwise use dev
settings_module = os.environ.get("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)
django.setup()

from accounts.models import User  # noqa: E402


def create_admin(email=None, password=None, username=None, full_name=None):
    """Create admin superuser if it doesn't exist"""
    # Default values
    email = email or os.environ.get("ADMIN_EMAIL", "admin@taskero.com")
    username = username or os.environ.get("ADMIN_USERNAME", "admin")
    password = password or os.environ.get("ADMIN_PASSWORD", "admin123")
    full_name = full_name or os.environ.get("ADMIN_FULL_NAME", "Admin User")

    if User.objects.filter(email=email).exists():
        print(f"Superuser with email {email} already exists!")
        user = User.objects.get(email=email)
        # Update password if provided
        if password and password != "admin123":
            user.set_password(password)
            user.save()
            print(f"Password updated for {email}")
        return user

    user = User.objects.create_superuser(username=username, email=email, password=password, full_name=full_name)

    print("=" * 50)
    print("Superuser created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print(f"Username: {username}")
    print("=" * 50)

    admin_url = os.environ.get("ADMIN_URL", "http://localhost:8000/admin/")
    print(f"\nYou can now login to Django admin at: {admin_url}")

    return user


if __name__ == "__main__":
    # Allow command line arguments
    email = sys.argv[1] if len(sys.argv) > 1 else None
    password = sys.argv[2] if len(sys.argv) > 2 else None
    username = sys.argv[3] if len(sys.argv) > 3 else None
    full_name = sys.argv[4] if len(sys.argv) > 4 else None

    create_admin(email, password, username, full_name)


if __name__ == "__main__":
    create_admin()
