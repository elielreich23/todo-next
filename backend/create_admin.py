"""
Script to create a Django admin user
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'taskero_backend.settings')
django.setup()

from django.contrib.auth.models import User

# Create or update admin user
username = 'admin@taskero.com'
email = 'admin@taskero.com'
password = 'admin123'

user, created = User.objects.get_or_create(
    username=username,
    defaults={'email': email}
)

user.set_password(password)
user.is_staff = True
user.is_superuser = True
user.is_active = True
user.save()

if created:
    print(f'Created admin user: {username}')
else:
    print(f'Updated admin user: {username}')
print(f'Email: {email}')
print(f'Password: {password}')
print('\nYou can now log in to Django admin at http://localhost:3001/admin/')

