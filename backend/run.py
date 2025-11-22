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
    from taskero_backend import compat_patch  # noqa: F401
    
    args = sys.argv[1:] or ['runserver', '127.0.0.1:8000']
    execute_from_command_line(['manage.py', *args])
