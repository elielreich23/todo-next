#!/usr/bin/env python
"""
Script to create a Django admin superuser
"""
import os

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")
django.setup()

from accounts.models import User  # noqa: E402


def create_admin():
    """Create admin superuser if it doesn't exist"""
    email = "admin@taskero.com"
    username = "admin"
    password = "admin123"
    full_name = "Admin User"

    if User.objects.filter(email=email).exists():
        print(f"Superuser with email {email} already exists!")
        return

    User.objects.create_superuser(username=username, email=email, password=password, full_name=full_name)

    print("=" * 50)
    print("Superuser created successfully!")
    print(f"Email: {email}")
    print(f"Password: {password}")
    print("=" * 50)
    print("\nYou can now login to Django admin at: http://localhost:8000/admin/")


if __name__ == "__main__":
    create_admin()
