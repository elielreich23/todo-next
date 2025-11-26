#!/usr/bin/env python
"""
Script to clear all users and emails from the database
"""
import os
import sys

import django

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")
django.setup()

from accounts.models import User  # noqa: E402
from projects.models import Project, Task  # noqa: E402


def clear_database():
    """Clear all users, projects, and tasks from the database"""
    print("Clearing database...")

    # Count before deletion
    user_count = User.objects.count()
    project_count = Project.objects.count()
    task_count = Task.objects.count()

    print(f"Found {user_count} user(s), {project_count} project(s), {task_count} task(s)")

    if user_count == 0:
        print("Database is already empty. Nothing to clear.")
        return

    # Delete all tasks first (optional, but explicit)
    Task.objects.all().delete()
    print("[OK] Deleted all tasks")

    # Delete all projects (optional, but explicit)
    Project.objects.all().delete()
    print("[OK] Deleted all projects")

    # Delete all users (this will also cascade delete related projects and tasks)
    User.objects.all().delete()
    print("[OK] Deleted all users")

    # Verify
    remaining_users = User.objects.count()
    remaining_projects = Project.objects.count()
    remaining_tasks = Task.objects.count()

    print("\n" + "=" * 50)
    print("Database cleared successfully!")
    print(f"Remaining users: {remaining_users}")
    print(f"Remaining projects: {remaining_projects}")
    print(f"Remaining tasks: {remaining_tasks}")
    print("=" * 50)


if __name__ == "__main__":
    # Allow skipping confirmation with --yes flag
    skip_confirmation = "--yes" in sys.argv or "-y" in sys.argv

    if skip_confirmation:
        clear_database()
    else:
        # Ask for confirmation
        response = input("Are you sure you want to delete ALL users and data? This cannot be undone! (yes/no): ")
        if response.lower() == "yes":
            clear_database()
        else:
            print("Operation cancelled.")
