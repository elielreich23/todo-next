"""
Run Django development server
"""
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskero_backend.settings')
    
    from django.core.management import execute_from_command_line
    
    # Run the development server
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:3001'])
