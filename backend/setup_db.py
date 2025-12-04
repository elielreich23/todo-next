#!/usr/bin/env python
"""
Script to set up the database with migrations
"""
import os

import django  # type: ignore[import]
from django.core.management import execute_from_command_line  # type: ignore[import]

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "taskero_backend.settings")
    django.setup()

    print("Creating migrations for projects app...")
    execute_from_command_line(["manage.py", "makemigrations", "projects"])

    print("Running migrations...")
    execute_from_command_line(["manage.py", "migrate"])

    print("Database setup complete!")
