#!/usr/bin/env python
"""
Simple script to run Django development server
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskero_backend.settings')
    django.setup()
    
    # Apply Python 3.14 compatibility patch
    from taskero_backend import compat_patch
    
    # Run migrations first
    print("Running migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    execute_from_command_line(['manage.py', 'migrate'])
    
    # Create superuser if it doesn't exist
    print("Creating superuser...")
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(email='admin@taskero.com').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@taskero.com',
            password='admin123',
            full_name='Admin User'
        )
        print("Superuser created: admin@taskero.com / admin123")
    else:
        print("Superuser already exists")
    
    # Start the development server
    print("Starting Django development server...")
    execute_from_command_line(['manage.py', 'runserver', '127.0.0.1:8000'])
